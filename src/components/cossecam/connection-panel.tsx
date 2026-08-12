"use client"

import { useEffect, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wifi,
  WifiOff,
  Copy,
  CheckCircle2,
  Users,
  Activity,
  Radio,
  Loader2,
  QrCode,
  Usb,
  RefreshCw,
  Smartphone,
  Cable,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCosseCamStore } from "@/store/cossecam-store"
import { useConnection } from "@/hooks/use-connection"
import { useUsbConnection } from "@/hooks/use-usb-connection"
import { QrCodeDialog } from "./qr-code-dialog"

export function ConnectionPanel() {
  const {
    connectionPanelOpen,
    setConnectionPanelOpen,
    connectionState,
    sessionId,
    peerCount,
    latency,
    connectionType,
    usbSupported,
    usbDeviceName,
    usbTetheringActive,
    usbIpAddress,
    usbDetecting,
  } = useCosseCamStore()

  const { connect, disconnect, measureLatency } = useConnection()
  const {
    requestUsbDevice,
    detectTethering,
    connectUsb,
    disconnectUsb,
  } = useUsbConnection()

  const [copied, setCopied] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const isUsbMode = connectionType === "usb"

  const handleConnect = useCallback(async () => {
    if (isUsbMode) {
      // USB connection flow
      if (usbSupported && !usbDeviceName) {
        await requestUsbDevice()
      }
      await detectTethering()
      await connectUsb()
    } else {
      connect()
    }
  }, [isUsbMode, usbSupported, usbDeviceName, requestUsbDevice, detectTethering, connectUsb, connect])

  const handleDisconnect = useCallback(() => {
    if (isUsbMode) {
      disconnectUsb()
    } else {
      disconnect()
    }
  }, [isUsbMode, disconnectUsb, disconnect])

  const handleRescanUsb = useCallback(async () => {
    await requestUsbDevice()
    await detectTethering()
  }, [requestUsbDevice, detectTethering])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = sessionId
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Auto-measure latency when connected
  useEffect(() => {
    if (connectionState === "connected" && !isUsbMode) {
      const timer = setTimeout(() => measureLatency(), 1000)
      return () => clearTimeout(timer)
    }
  }, [connectionState, measureLatency, isUsbMode])

  const stateConfig = {
    disconnected: {
      label: "Déconnecté",
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
      icon: WifiOff,
    },
    connecting: {
      label: "Connexion en cours…",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      icon: Loader2,
    },
    connected: {
      label: isUsbMode ? "Connecté (USB)" : "Connecté",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      icon: isUsbMode ? Usb : Wifi,
    },
  }

  const state = stateConfig[connectionState]
  const StateIcon = state.icon

  return (
    <Sheet open={connectionPanelOpen} onOpenChange={setConnectionPanelOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t border-white/10 bg-gray-950"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Radio className="h-4 w-4 text-emerald-400" />
            Connexion
            {isUsbMode && (
              <Badge variant="outline" className="ml-2 gap-1 border-blue-500/30 bg-blue-500/10 text-blue-400">
                <Usb className="h-3 w-3" />
                USB
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-gray-500">
            {isUsbMode
              ? "Connectez votre téléphone via câble USB."
              : "Gérez la connexion entre votre téléphone et l'ordinateur."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 pt-4 pb-4">
          {/* USB-specific section */}
          {isUsbMode && (
            <>
              {/* USB device detection card */}
              <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Usb className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Appareil USB
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRescanUsb}
                    disabled={usbDetecting}
                    className="gap-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
                  >
                    {usbDetecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs">Rescanner</span>
                  </Button>
                </div>

                {!usbSupported ? (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs text-amber-400">
                      WebUSB n'est pas disponible dans ce navigateur. Utilisez Chrome ou Edge.
                    </p>
                  </div>
                ) : usbDeviceName ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <Smartphone className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-emerald-300">
                        {usbDeviceName}
                      </p>
                      <p className="text-[10px] text-emerald-400/60">Appareil détecté via WebUSB</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Aucun appareil USB détecté. Connectez votre téléphone et activez le partage de connexion USB.
                  </p>
                )}
              </div>

              {/* USB Tethering status */}
              <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Cable className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">
                    Partage USB (tethering)
                  </span>
                  {usbTetheringActive && (
                    <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                      Actif
                    </Badge>
                  )}
                </div>

                {usbDetecting && (
                  <div className="flex items-center gap-2 px-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    <p className="text-xs text-amber-400">
                      Recherche en cours — vérification des plages IP USB (192.168.42.x, 192.168.43.x)…
                    </p>
                  </div>
                )}

                {usbTetheringActive && usbIpAddress ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <Cable className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-emerald-300">
                        Tethering détecté
                      </p>
                      <p className="font-mono text-[10px] text-emerald-400/60">
                        {usbIpAddress}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  </div>
                ) : !usbDetecting && (
                  <p className="text-xs text-gray-500">
                    Activez le partage de connexion USB sur votre téléphone, puis cliquez sur «&nbsp;Rescanner&nbsp;».
                  </p>
                )}

                {/* USB instructions */}
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
                  <p className="mb-2 text-xs font-medium text-gray-400">
                    Comment connecter en USB :
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-[11px] text-gray-500">
                    <li>Connectez le câble USB au téléphone et à l'ordinateur</li>
                    <li>Sur le téléphone, activez «&nbsp;Partage de connexion USB&nbsp;» dans les paramètres réseau</li>
                    <li>Cliquez sur «&nbsp;Rescanner&nbsp;» pour détecter le téléphone</li>
                    <li>Cliquez sur «&nbsp;Se connecter&nbsp;» pour lancer le flux vidéo</li>
                  </ol>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />
            </>
          )}

          {/* Status card */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${state.bgColor} ${state.borderColor}`}
          >
            <StateIcon
              className={`h-5 w-5 ${state.color} ${
                connectionState === "connecting" ? "animate-spin" : ""
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${state.color}`}>{
                state.label
              }</p>
              <p className="text-xs text-gray-500">
                {connectionState === "connected"
                  ? isUsbMode
                    ? `USB${usbIpAddress ? ` — ${usbIpAddress}` : ""}`
                    : `${peerCount} appareil${peerCount > 1 ? "s" : ""} connecté${peerCount > 1 ? "s" : ""}`
                  : isUsbMode
                    ? "En attente de connexion USB"
                    : "Aucun appareil connecté"}
              </p>
            </div>
          </div>

          {/* Session ID — hidden in USB mode */}
          {!isUsbMode && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Identifiant de session
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 p-3">
                  <code className="min-w-0 flex-1 truncate font-mono text-sm text-emerald-300">
                    {sessionId}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="shrink-0 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Partagez cet identifiant avec l'ordinateur récepteur.
                </p>
              </div>

              {/* QR Code Button */}
              <Button
                onClick={() => setQrDialogOpen(true)}
                variant="outline"
                className="w-full gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                <QrCode className="h-4 w-4" />
                Afficher le QR Code de connexion
              </Button>

              <Separator className="bg-white/[0.06]" />
            </>
          )}

          {/* Stats row */}
          {!isUsbMode && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs">Appareils</span>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold text-white">
                  {peerCount}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-xs">Latence</span>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold text-white">
                  {latency > 0 ? `${latency}ms` : "—"}
                </p>
              </div>
            </div>
          )}

          {/* USB latency indicator */}
          {isUsbMode && usbTetheringActive && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-xs">Connexion USB</span>
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-white">
                {usbIpAddress || "—"}
              </p>
              <p className="mt-0.5 text-[10px] text-blue-400/60">
                Latence ultra-faible via câble USB
              </p>
            </div>
          )}

          {/* Connect / Disconnect button */}
          <AnimatePresence mode="wait">
            {connectionState === "disconnected" ? (
              <motion.div
                key="connect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={handleConnect}
                  disabled={isUsbMode && usbDetecting}
                  className={`w-full ${
                    isUsbMode
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  } disabled:opacity-50`}
                >
                  {isUsbMode ? (
                    <Usb className="mr-2 h-4 w-4" />
                  ) : (
                    <Wifi className="mr-2 h-4 w-4" />
                  )}
                  {isUsbMode ? "Détecter et se connecter" : "Se connecter"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="disconnect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <WifiOff className="mr-2 h-4 w-4" />
                  Se déconnecter
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>

      <QrCodeDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} />
    </Sheet>
  )
}
