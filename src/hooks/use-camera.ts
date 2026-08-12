"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useCosseCamStore, type Resolution } from "@/store/cossecam-store"
import { cameraStream } from "@/lib/camera-stream"

const RESOLUTION_MAP: Record<Resolution, { width: number; height: number }> = {
  "144p": { width: 256, height: 144 },
  "240p": { width: 426, height: 240 },
  "360p": { width: 640, height: 360 },
  "480p": { width: 640, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "1440p": { width: 2560, height: 1440 },
  "4k": { width: 3840, height: 2160 },
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    isCameraActive,
    setCameraActive,
    cameraFacing,
    resolution,
    frameRate,
    audioEnabled,
    sharpness,
  } = useCosseCamStore()

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }

      const res = RESOLUTION_MAP[resolution]
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: res.width },
          height: { ideal: res.height },
          frameRate: { ideal: frameRate },
          facingMode: cameraFacing,
        },
        audio: audioEnabled,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Share the stream globally (Bug #3 fix)
      cameraStream.set(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "Aucune caméra trouvée sur cet appareil."
            : err instanceof DOMException && err.name === "NotReadableError"
              ? "La caméra est déjà utilisée par une autre application."
              : "Erreur inattendue lors de l'accès à la caméra."
      setError(message)
      console.error("Camera error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [resolution, frameRate, cameraFacing, audioEnabled, setCameraActive])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // Clear shared stream (Bug #3 fix)
    cameraStream.set(null)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [setCameraActive])

  const switchCamera = useCallback(async () => {
    if (isCameraActive) {
      stopCamera()
      useCosseCamStore.getState().toggleCameraFacing()
      // Small delay for camera switch
      setTimeout(() => {
        startCamera()
      }, 300)
    }
  }, [isCameraActive, stopCamera, startCamera])

  // ─── Bug #1 fix: Apply sharpness via track constraints ────
  useEffect(() => {
    const stream = streamRef.current
    if (!stream || !isCameraActive) return

    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return

    try {
      const capabilities = videoTrack.getCapabilities?.() as
        | { sharpness?: { min: number; max: number; step: number } }
        | undefined

      if (capabilities?.sharpness) {
        const normalized = Math.round(
          capabilities.sharpness.min +
            (sharpness / 100) *
              (capabilities.sharpness.max - capabilities.sharpness.min)
        )
        videoTrack.applyConstraints({
          advanced: [{ sharpness: normalized }],
        } as MediaTrackConstraints)
      }
    } catch {
      // Sharpness not supported on this device/browser — ignore silently
    }
  }, [sharpness, isCameraActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      cameraStream.set(null)
    }
  }, [])

  return {
    videoRef,
    streamRef,
    error,
    isLoading,
    isCameraActive,
    startCamera,
    stopCamera,
    switchCamera,
  }
}
