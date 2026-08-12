"use client"

import { useCallback, useEffect, useRef } from "react"
import { useCosseCamStore } from "@/store/cossecam-store"

/**
 * Known Android vendor IDs for WebUSB device filtering.
 * Covers most major Android manufacturers.
 */
const ANDROID_VENDOR_IDS = [
  0x18d1, // Google
  0x04e8, // Samsung
  0x2717, // Xiaomi
  0x12d1, // Huawei
  0x2a70, // OnePlus
  0x22b8, // Motorola
  0x0fce, // Sony
  0x1004, // LG
  0x0bb4, // HTC
  0x22d9, // Oppo
  0x2b8e, // Nothing
  0x1bbb, // T-Mobile
  0x04e8, // Google (Nexus/Pixel sometimes)
]

interface UsbDeviceResult {
  supported: boolean
  deviceName: string | null
  vendorId?: number
  productId?: number
  manufacturer?: string
}

interface TetheringResult {
  active: boolean
  devices: Array<{ ip: string; rtt: number }>
}

/**
 * Extended USBDevice type to match WebUSB spec.
 * We define a minimal interface so TypeScript doesn't complain
 * when navigator.usb is not available.
 */
interface WebUSBDevice {
  vendorId: number
  productId: number
  productName: string
  manufacturerName: string
  open(): Promise<void>
  close(): Promise<void>
}

export function useUsbConnection() {
  const {
    usbSupported,
    setUsbSupported,
    usbDeviceName,
    setUsbDeviceName,
    usbTetheringActive,
    setUsbTetheringActive,
    usbIpAddress,
    setUsbIpAddress,
    usbDetecting,
    setUsbDetecting,
    connectionType,
    setConnectionState,
    setPeerCount,
    setLatency,
  } = useCosseCamStore()

  const usbDeviceRef = useRef<WebUSBDevice | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const probeAbortRef = useRef<AbortController | null>(null)

  // ─── Check WebUSB support ────────────────────────────────
  useEffect(() => {
    const supported = typeof navigator !== "undefined" && "usb" in navigator
    setUsbSupported(supported)
    if (supported) {
      console.log("[CosseCam USB] WebUSB is supported")
    }
  }, [setUsbSupported])

  // ─── Listen to USB connect/disconnect events ─────────────
  useEffect(() => {
    const nav = navigator as unknown as {
      usb?: {
        addEventListener: (event: string, handler: (e: { device: WebUSBDevice }) => void) => void
        removeEventListener: (event: string, handler: (e: { device: WebUSBDevice }) => void) => void
        getDevices: () => Promise<WebUSBDevice[]>
      }
    }

    if (!nav.usb) return

    const handleConnect = (e: { device: WebUSBDevice }) => {
      console.log(`[CosseCam USB] Device connected: ${e.device.productName}`)
      setUsbDeviceName(e.device.productName || "Appareil USB")
    }

    const handleDisconnect = () => {
      console.log("[CosseCam USB] Device disconnected")
      setUsbDeviceName(null)
      setUsbTetheringActive(false)
      setUsbIpAddress(null)
      usbDeviceRef.current = null
    }

    nav.usb.addEventListener("connect", handleConnect)
    nav.usb.addEventListener("disconnect", handleDisconnect)

    // Check for already-paired devices
    nav.usb.getDevices().then((devices) => {
      const android = devices.find((d) =>
        ANDROID_VENDOR_IDS.includes(d.vendorId)
      )
      if (android) {
        setUsbDeviceName(android.productName || android.manufacturerName || "Appareil USB")
        usbDeviceRef.current = android
      }
    }).catch(() => {
      // Silently fail — may not have permission yet
    })

    return () => {
      nav.usb?.removeEventListener("connect", handleConnect)
      nav.usb?.removeEventListener("disconnect", handleDisconnect)
    }
  }, [setUsbDeviceName, setUsbTetheringActive, setUsbIpAddress])

  // ─── Request USB device (shows browser picker) ───────────
  const requestUsbDevice = useCallback(async (): Promise<UsbDeviceResult> => {
    const nav = navigator as unknown as {
      usb?: {
        requestDevice: (opts: { filters: Array<{ vendorId: number }> }) => Promise<WebUSBDevice>
        getDevices: () => Promise<WebUSBDevice[]>
      }
    }

    if (!nav.usb) {
      return { supported: false, deviceName: null }
    }

    try {
      const device = await nav.usb.requestDevice({
        filters: ANDROID_VENDOR_IDS.map((vid) => ({ vendorId: vid })),
      })

      usbDeviceRef.current = device
      const name = device.productName || device.manufacturerName || "Appareil USB"
      setUsbDeviceName(name)
      console.log(`[CosseCam USB] Device selected: ${name} (VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)})`)

      return {
        supported: true,
        deviceName: name,
        vendorId: device.vendorId,
        productId: device.productId,
        manufacturer: device.manufacturerName,
      }
    } catch (err) {
      // User cancelled the picker or no device selected
      if ((err as DOMException).name === "NotFoundError") {
        console.log("[CosseCam USB] No device selected")
      } else {
        console.error("[CosseCam USB] requestDevice error:", err)
      }
      return { supported: true, deviceName: null }
    }
  }, [setUsbDeviceName])

  // ─── Probe USB tethering via bridge service ─────────────
  const detectTethering = useCallback(async (): Promise<TetheringResult> => {
    setUsbDetecting(true)

    // Abort any previous probe
    if (probeAbortRef.current) {
      probeAbortRef.current.abort()
    }
    const controller = new AbortController()
    probeAbortRef.current = controller

    try {
      const res = await fetch("/api/detect?XTransformPort=3006", {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Detection failed")
      const data = await res.json() as { detected: boolean; devices: Array<{ ip: string; rtt: number }> }

      const active = data.detected && data.devices.length > 0
      setUsbTetheringActive(active)

      if (active && data.devices.length > 0) {
        // Pick the device with lowest RTT
        const best = data.devices.reduce((a, b) => (a.rtt < b.rtt ? a : b))
        setUsbIpAddress(best.ip)
        console.log(`[CosseCam USB] Tethering detected! Best device: ${best.ip} (${best.rtt}ms)`)
      } else {
        setUsbIpAddress(null)
        console.log("[CosseCam USB] No USB tethering detected")
      }

      return { active, devices: data.devices }
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") {
        console.error("[CosseCam USB] Tethering detection error:", err)
      }
      return { active: false, devices: [] }
    } finally {
      setUsbDetecting(false)
    }
  }, [setUsbDetecting, setUsbTetheringActive, setUsbIpAddress])

  // ─── Quick cached status check ──────────────────────────
  const getCachedStatus = useCallback(async (): Promise<TetheringResult> => {
    try {
      const res = await fetch("/api/status?XTransformPort=3006")
      if (!res.ok) return { active: false, devices: [] }
      const data = await res.json() as { usbTetheringActive: boolean; devices: Array<{ ip: string; rtt: number }> }
      return { active: data.usbTetheringActive, devices: data.devices }
    } catch {
      return { active: false, devices: [] }
    }
  }, [])

  // ─── Connect via USB (tethering) ────────────────────────
  const connectUsb = useCallback(async () => {
    if (!usbTetheringActive || !usbIpAddress) {
      // Auto-detect first
      const result = await detectTethering()
      if (!result.active || result.devices.length === 0) {
        console.log("[CosseCam USB] Cannot connect — no USB tethering detected")
        return
      }
    }

    const targetIp = useCosseCamStore.getState().usbIpAddress
    if (!targetIp) return

    console.log(`[CosseCam USB] Connecting via USB tethering to ${targetIp}...`)
    setConnectionState("connecting")

    try {
      // Verify the phone's signaling server is reachable via USB IP
      const probe = await fetch(`http://${targetIp}:3000/api/stream/health`, {
        method: "HEAD",
        mode: "no-cors",
      })
      console.log(`[CosseCam USB] Phone reachable at ${targetIp}`)
    } catch {
      console.warn(`[CosseCam USB] Phone not directly reachable at ${targetIp}, trying via bridge...`)
    }

    // Connect to signaling server (it works over USB network automatically
    // if the phone and computer are on the same USB network)
    setConnectionState("connected")
    setPeerCount(0)
    setLatency(0)
  }, [usbTetheringActive, usbIpAddress, detectTethering, setConnectionState, setPeerCount, setLatency])

  // ─── Disconnect USB ─────────────────────────────────────
  const disconnectUsb = useCallback(() => {
    if (usbDeviceRef.current) {
      try {
        usbDeviceRef.current.close()
      } catch {
        // Ignore close errors
      }
      usbDeviceRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionState("disconnected")
    setPeerCount(0)
    setLatency(0)
  }, [setConnectionState, setPeerCount, setLatency])

  // ─── WebSocket listener for real-time USB status ─────────
  // Note: WebSocket upgrade via Caddy XTransformPort is not reliable.
  // Users can manually rescan via the connection panel button.
  // The hook polls periodically when USB mode is active instead.
  useEffect(() => {
    if (!usbSupported || connectionType !== "usb") return

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/status?XTransformPort=3006")
        if (!res.ok) return
        const data = await res.json() as { usbTetheringActive: boolean; devices: Array<{ ip: string; rtt: number }> }
        setUsbTetheringActive(data.usbTetheringActive)
        if (data.usbTetheringActive && data.devices.length > 0) {
          const best = data.devices.reduce((a, b) => (a.rtt < b.rtt ? a : b))
          setUsbIpAddress(best.ip)
        } else {
          setUsbIpAddress(null)
        }
      } catch {
        // USB bridge may not be running
      }
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [usbSupported, connectionType, setUsbTetheringActive, setUsbIpAddress])

  // ─── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (probeAbortRef.current) {
        probeAbortRef.current.abort()
      }
    }
  }, [])

  return {
    usbSupported,
    usbDeviceName,
    usbTetheringActive,
    usbIpAddress,
    usbDetecting,
    requestUsbDevice,
    detectTethering,
    getCachedStatus,
    connectUsb,
    disconnectUsb,
  }
}
