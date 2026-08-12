"use client"

import { useCallback, useEffect, useRef } from "react"
import { useCosseCamStore } from "@/store/cossecam-store"

type ScreenshotCallback = (dataUrl: string) => void

type ScreenshotFormat = "png" | "jpeg" | "webp"

export interface ScreenshotOptions {
  format?: ScreenshotFormat
  quality?: number
  includeFilters?: boolean
  callback?: ScreenshotCallback
}

export interface RecordingOptions {
  mimeType?: string
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
  timeslice?: number
}

const FORMAT_MIME_MAP: Record<string, string> = {
  "webm-vp9": "video/webm;codecs=vp9,opus",
  "webm-vp8": "video/webm;codecs=vp8,opus",
  "webm-h264": "video/webm;codecs=h264,opus",
  mp4: "video/mp4",
}

const FORMAT_EXT_MAP: Record<string, string> = {
  "webm-vp9": "webm",
  "webm-vp8": "webm",
  "webm-h264": "webm",
  mp4: "mp4",
}

const QUALITY_BITRATE_MAP: Record<string, number> = {
  low: 500_000,
  medium: 1_500_000,
  high: 2_500_000,
  ultra: 5_000_000,
}

const ALL_MIME_FALLBACKS = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=h264,opus",
  "video/webm",
  "video/mp4",
]

export function useCameraFeatures(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  streamRef: React.RefObject<MediaStream | null>
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null)

  // Canvas mirror refs for Bug #2 (filtered recording)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasAnimRef = useRef<number | null>(null)

  const {
    setIsRecording,
    setRecordingStartTime,
    setIsPipActive,
    setLastScreenshotUrl,
    setScreenshotFlash,
    isRecording,
    isCameraActive,
    brightness,
    contrast,
    saturation,
    exposure,
    recordingFormat,
    recordingQuality,
  } = useCosseCamStore()

  // ─── Canvas Mirror for filtered recording (Bug #2) ──────
  const startCanvasMirror = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return false

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvasRef.current = canvas

    const ctx = canvas.getContext("2d")
    if (!ctx) return false

    const render = () => {
      if (video.readyState >= 2 && canvasRef.current) {
        const state = useCosseCamStore.getState()
        const effectiveBrightness = state.brightness + state.exposure

        // Apply the same filters as the CSS filter on <video>
        ctx.filter = `brightness(${effectiveBrightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%)`

        // Apply transforms (zoom, rotation, flip)
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((state.rotation * Math.PI) / 180)
        ctx.scale(
          state.zoom * (state.flipH ? -1 : 1),
          state.zoom * (state.flipV ? -1 : 1)
        )
        ctx.drawImage(
          video,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        )
        ctx.restore()
      }
      canvasAnimRef.current = requestAnimationFrame(render)
    }

    // Draw first frame immediately, then schedule loop
    render()
    return true
  }, [videoRef])

  const stopCanvasMirror = useCallback(() => {
    if (canvasAnimRef.current) {
      cancelAnimationFrame(canvasAnimRef.current)
      canvasAnimRef.current = null
    }
    canvasRef.current = null
  }, [])

  // Auto-stop canvas mirror when camera stops
  useEffect(() => {
    if (!isCameraActive) {
      stopCanvasMirror()
    }
  }, [isCameraActive, stopCanvasMirror])

  // Build a MediaStream from the canvas (video) + original stream (audio)
  const getFilteredStream = useCallback((): MediaStream | null => {
    const canvas = canvasRef.current
    const originalStream = streamRef.current
    if (!canvas || !originalStream) return null

    const fps = useCosseCamStore.getState().frameRate || 30
    let canvasStream: MediaStream
    try {
      canvasStream = canvas.captureStream(fps)
    } catch {
      return null
    }

    // Copy audio tracks from the original stream
    originalStream.getAudioTracks().forEach((track) => {
      canvasStream.addTrack(track)
    })

    return canvasStream
  }, [streamRef])

  // ─── Screenshot ───────────────────────────────────────────
  const takeScreenshot = useCallback(
    (options: ScreenshotOptions = {}) => {
      const video = videoRef.current
      if (!video || !isCameraActive) return null

      const {
        format = "png",
        quality = 0.95,
        includeFilters = true,
        callback,
      } = options

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      // Apply CSS filters to canvas if requested
      if (includeFilters) {
        const effectiveBrightness = brightness + exposure
        ctx.filter = `brightness(${effectiveBrightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const mimeType =
        format === "jpeg"
          ? "image/jpeg"
          : format === "webp"
            ? "image/webp"
            : "image/png"

      const dataUrl = canvas.toDataURL(mimeType, quality)

      // Flash effect
      setScreenshotFlash(true)
      setTimeout(() => setScreenshotFlash(false), 200)

      // Download the image
      const link = document.createElement("a")
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      link.download = `cossecam-capture-${timestamp}.${format}`
      link.href = dataUrl
      link.click()

      setLastScreenshotUrl(dataUrl)
      callback?.(dataUrl)

      return dataUrl
    },
    [videoRef, isCameraActive, brightness, contrast, saturation, exposure, setScreenshotFlash, setLastScreenshotUrl]
  )

  // ─── Recording (Bug #2: uses canvas stream for filtered output) ──
  const startRecording = useCallback(
    (options: RecordingOptions = {}) => {
      // Start canvas mirror so the recording captures filters
      const canvasReady = startCanvasMirror()

      // Use filtered canvas stream when possible, fallback to raw stream
      const stream = canvasReady
        ? getFilteredStream()
        : streamRef.current

      if (!stream || isRecording) return

      // Determine preferred mimeType from store format
      const preferredMime = FORMAT_MIME_MAP[recordingFormat] || "video/webm;codecs=vp9,opus"
      const optionsMime = options.mimeType

      // Priority: explicit option > store format > fallback chain
      let selectedMimeType = optionsMime || preferredMime
      if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
        const fallbacks = optionsMime
          ? [optionsMime, preferredMime, ...ALL_MIME_FALLBACKS]
          : [preferredMime, ...ALL_MIME_FALLBACKS]
        for (const fb of fallbacks) {
          if (MediaRecorder.isTypeSupported(fb)) {
            selectedMimeType = fb
            break
          }
        }
      }

      // Determine bitrate from store quality (can be overridden)
      const videoBitsPerSecond =
        options.videoBitsPerSecond || QUALITY_BITRATE_MAP[recordingQuality] || 2_500_000

      // Derive file extension from the chosen mime
      let ext = FORMAT_EXT_MAP[recordingFormat] || "webm"
      if (selectedMimeType.includes("mp4")) ext = "mp4"
      else if (selectedMimeType.includes("webm")) ext = "webm"

      recordedChunksRef.current = []

      const recorderOptions: MediaRecorderOptions = {
        mimeType: selectedMimeType,
        videoBitsPerSecond,
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: selectedMimeType,
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        link.download = `cossecam-recording-${timestamp}.${ext}`
        link.href = url
        link.click()

        // Clean up the object URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000)

        // Stop the canvas mirror — recording is done
        stopCanvasMirror()
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder

      setIsRecording(true)
      setRecordingStartTime(Date.now())
    },
    [
      streamRef, isRecording, recordingFormat, recordingQuality,
      setIsRecording, setRecordingStartTime,
      startCanvasMirror, getFilteredStream, stopCanvasMirror,
    ]
  )

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return

    mediaRecorderRef.current.stop()
    mediaRecorderRef.current = null
    recordedChunksRef.current = []

    setIsRecording(false)
    setRecordingStartTime(null)
  }, [isRecording, setIsRecording, setRecordingStartTime])

  const toggleRecording = useCallback(
    (options?: RecordingOptions) => {
      if (isRecording) {
        stopRecording()
      } else {
        startRecording(options)
      }
    },
    [isRecording, startRecording, stopRecording]
  )

  // ─── Picture-in-Picture ───────────────────────────────────
  const togglePip = useCallback(async () => {
    const video = videoRef.current
    if (!video || !isCameraActive) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPipActive(false)
      } else {
        await video.requestPictureInPicture()
        setIsPipActive(true)
      }
    } catch (err) {
      console.error("PiP error:", err)
    }
  }, [videoRef, isCameraActive, setIsPipActive])

  // ─── Fullscreen ───────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const container = fullscreenContainerRef.current
    if (!container) return

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        container.requestFullscreen()
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }, [])

  // ─── Focus / Tap-to-expose ────────────────────────────────
  const handleVideoTap = useCallback(
    (event: React.MouseEvent<HTMLVideoElement>) => {
      if (!isCameraActive) return

      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100

      // Try to use ImageCapture API for focus/exposure on the track
      const stream = streamRef.current
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities?.() as
            | { focusMode?: string[]; exposureMode?: string[] }
            | undefined
          const settings = videoTrack.getSettings?.() as
            | { focusMode?: string; exposureMode?: string }
            | undefined

          if (capabilities?.focusMode && settings?.focusMode !== "continuous") {
            try {
              // @ts-expect-error advanced constraint
              videoTrack.applyConstraints({
                advanced: [{ focusMode: "manual", focusDistance: 0.5 }],
              })
              setTimeout(() => {
                try {
                  // @ts-expect-error advanced constraint
                  videoTrack.applyConstraints({
                    advanced: [{ focusMode: "continuous" }],
                  })
                } catch {
                  // Ignore
                }
              }, 2000)
            } catch {
              // Ignore if not supported
            }
          }
        }
      }
    },
    [isCameraActive, streamRef]
  )

  // Listen for PiP exit (user can close PiP window manually)
  useEffect(() => {
    const handlePipLeave = () => setIsPipActive(false)
    const video = videoRef.current
    if (video) {
      video.addEventListener("leavepictureinpicture", handlePipLeave)
      return () => video.removeEventListener("leavepictureinpicture", handlePipLeave)
    }
  }, [videoRef, setIsPipActive])

  // Auto-stop recording when camera stops
  useEffect(() => {
    if (!isCameraActive && isRecording) {
      stopRecording()
    }
  }, [isCameraActive, isRecording, stopRecording])

  return {
    fullscreenContainerRef,
    takeScreenshot,
    startRecording,
    stopRecording,
    toggleRecording,
    togglePip,
    toggleFullscreen,
    handleVideoTap,
  }
}
