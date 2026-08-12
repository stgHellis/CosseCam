"use client"

import { useEffect, useMemo, useState } from "react"
import { CameraOff, Loader2 } from "lucide-react"
import { useCosseCamStore, type OverlayConfig } from "@/store/cossecam-store"

// ─── Grid Overlay (Rule of Thirds) ─────────────────────────
function GridOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      preserveAspectRatio="none"
    >
      {/* Vertical lines */}
      <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      {/* Horizontal lines */}
      <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
      {/* Center crosshair */}
      <line x1="50%" y1="48%" x2="50%" y2="52%" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <line x1="48%" y1="50%" x2="52%" y2="50%" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    </svg>
  )
}

// ─── Recording Indicator ───────────────────────────────────
function RecordingIndicator() {
  const { isRecording, recordingStartTime, recordingFormat, recordingQuality } = useCosseCamStore()

  const elapsed = useRecordingTimer(isRecording, recordingStartTime)

  if (!isRecording) return null

  const FORMAT_LABELS: Record<string, string> = {
    "webm-vp9": "VP9",
    "webm-vp8": "VP8",
    "webm-h264": "H.264",
    mp4: "MP4",
  }

  const QUALITY_LABELS: Record<string, string> = {
    low: "Faible",
    medium: "Moyen",
    high: "Élevé",
    ultra: "Ultra",
  }

  return (
    <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 rounded-full bg-red-600/80 px-2.5 py-1 backdrop-blur-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span className="font-mono text-xs font-medium text-white">
          REC {elapsed}
        </span>
      </div>
      <div className="rounded-md bg-black/50 px-2 py-0.5 backdrop-blur-sm">
        <span className="font-mono text-[10px] text-white/50">
          {FORMAT_LABELS[recordingFormat] || recordingFormat} · {QUALITY_LABELS[recordingQuality] || recordingQuality}
        </span>
      </div>
    </div>
  )
}

function useRecordingTimer(isRecording: boolean, startTime: number | null): string {
  const [elapsed, setElapsed] = useState("00:00")

  useEffect(() => {
    if (!isRecording || !startTime) return

    const update = () => {
      const diff = Math.floor((Date.now() - startTime) / 1000)
      const mins = Math.floor(diff / 60)
        .toString()
        .padStart(2, "0")
      const secs = (diff % 60).toString().padStart(2, "0")
      setElapsed(`${mins}:${secs}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isRecording, startTime])

  if (!isRecording || !startTime) return "00:00"
  return elapsed
}

// ─── Camera Info Badge ─────────────────────────────────────
function CameraInfoBadge() {
  const { resolution, frameRate, showCameraInfo, isCameraActive, zoom, cameraFacing, isRecording, recordingFormat, recordingQuality } =
    useCosseCamStore()

  if (!showCameraInfo || !isCameraActive) return null

  const RES_LABELS: Record<string, string> = {
    "144p": "144p",
    "240p": "240p",
    "360p": "360p",
    "480p": "480p",
    "720p": "720p HD",
    "1080p": "1080p FHD",
    "1440p": "1440p QHD",
    "4k": "4K UHD",
  }

  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-1">
      <div className="rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
        <span className="font-mono text-[10px] font-medium text-white/80">
          {RES_LABELS[resolution] || resolution.toUpperCase()}
        </span>
      </div>
      {zoom !== 1 && (
        <div className="rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
          <span className="font-mono text-[10px] font-medium text-emerald-400">
            {zoom.toFixed(1)}x
          </span>
        </div>
      )}
      <div className="rounded-md bg-black/50 px-2 py-0.5 backdrop-blur-sm">
        <span className="font-mono text-[10px] text-white/50">
          {frameRate}fps {cameraFacing === "user" ? "AV" : "AR"}
        </span>
      </div>
      {isRecording && (
        <div className="rounded-md bg-red-500/20 px-2 py-0.5 backdrop-blur-sm">
          <span className="font-mono text-[10px] text-red-400">
            {recordingFormat.replace("webm-", "").toUpperCase()} · {recordingQuality === "ultra" ? "5M" : recordingQuality === "high" ? "2.5M" : recordingQuality === "medium" ? "1.5M" : "0.5M"}bps
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Screenshot Flash ──────────────────────────────────────
function ScreenshotFlash() {
  const { screenshotFlash } = useCosseCamStore()
  if (!screenshotFlash) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-50 animate-pulse bg-white/70" />
  )
}

// ─── Overlay Renderer ──────────────────────────────────────
function OverlayRenderer({ overlay }: { overlay: OverlayConfig }) {
  if (!overlay.isVisible) return null

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${overlay.positionX}%`,
    top: `${overlay.positionY}%`,
    width: `${overlay.width}%`,
    height: overlay.type === "lower-third" ? "auto" : `${overlay.height}%`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 10,
  }

  if (overlay.type === "text") {
    return (
      <div style={baseStyle} className="whitespace-nowrap">
        <span
          style={{
            fontSize: `${overlay.fontSize}px`,
            color: overlay.fontColor,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {overlay.content}
        </span>
      </div>
    )
  }

  if (overlay.type === "image" && overlay.imageUrl) {
    return (
      <div style={baseStyle}>
        <img
          src={overlay.imageUrl}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
    )
  }

  if (overlay.type === "lower-third") {
    return (
      <div
        style={{
          ...baseStyle,
          left: "5%",
          bottom: "8%",
          top: "auto",
          transform: "none",
          width: "60%",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            backgroundColor: `${overlay.bgColor}${Math.round(overlay.bgOpacity * 255)
              .toString(16)
              .padStart(2, "0")}`,
            padding: "8px 16px",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              fontSize: `${overlay.fontSize}px`,
              fontWeight: 700,
              color: overlay.fontColor,
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {overlay.content}
          </div>
          {overlay.secondaryText && (
            <div
              style={{
                fontSize: `${Math.max(12, overlay.fontSize - 4)}px`,
                color: overlay.fontColor,
                opacity: 0.8,
                marginTop: "2px",
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {overlay.secondaryText}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

// ─── Main Camera Preview ───────────────────────────────────
interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isLoading: boolean
  error: string | null
  onVideoTap?: (e: React.MouseEvent<HTMLVideoElement>) => void
}

export function CameraPreview({
  videoRef,
  isLoading,
  error,
  onVideoTap,
}: CameraPreviewProps) {
  const {
    brightness,
    contrast,
    saturation,
    exposure,
    zoom,
    rotation,
    flipH,
    flipV,
    overlays,
    isCameraActive,
    showGrid,
  } = useCosseCamStore()

  // Bug #1 fix: exposure is combined with brightness (both are light adjustments)
  const effectiveBrightness = brightness + exposure

  const filterStyle = useMemo(
    () => ({
      filter: `brightness(${effectiveBrightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
      transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    }),
    [effectiveBrightness, contrast, saturation, zoom, rotation, flipH, flipV]
  )

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full cursor-crosshair object-contain"
        style={filterStyle}
        onClick={onVideoTap}
      />

      {/* Feature overlays */}
      {showGrid && <GridOverlay />}
      <RecordingIndicator />
      <CameraInfoBadge />
      <ScreenshotFlash />

      {/* State overlays */}
      <IdleOverlay show={!isCameraActive && !isLoading && !error} />
      <LoadingOverlay show={isLoading && !error} />
      <ErrorOverlay show={!!error} message={error} />

      {/* User overlays */}
      {overlays.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {overlays.map((overlay) => (
            <OverlayRenderer key={overlay.id} overlay={overlay} />
          ))}
        </div>
      )}

      {/* Vignette gradient edges */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  )
}

// ─── State overlay sub-components ──────────────────────────

function IdleOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10">
        <CameraOff className="h-7 w-7 text-gray-600" />
      </div>
      <p className="text-sm text-gray-500">
        Appuyez sur le bouton pour demarrer la camera
      </p>
    </div>
  )
}

function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      <span className="text-sm text-gray-400">Activation de la camera...</span>
    </div>
  )
}

function ErrorOverlay({ show, message }: { show: boolean; message: string | null }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
      <CameraOff className="h-10 w-10 text-red-400" />
      <p className="max-w-xs text-center text-sm text-red-300">{message}</p>
    </div>
  )
}
