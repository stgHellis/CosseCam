"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useCosseCamStore, type Resolution } from "@/store/cossecam-store"

const RESOLUTION_MAP: Record<Resolution, { width: number; height: number }> = {
  "480p": { width: 640, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
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
