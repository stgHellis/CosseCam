"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CameraOff, Loader2 } from "lucide-react"
import { useCosseCamStore, type OverlayConfig } from "@/store/cossecam-store"

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
      <div
        style={baseStyle}
        className="whitespace-nowrap"
      >
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

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isLoading: boolean
  error: string | null
}

export function CameraPreview({ videoRef, isLoading, error }: CameraPreviewProps) {
  const {
    brightness,
    contrast,
    saturation,
    zoom,
    rotation,
    flipH,
    flipV,
    overlays,
  } = useCosseCamStore()

  const filterStyle = useMemo(
    () => ({
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
      transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    }),
    [brightness, contrast, saturation, zoom, rotation, flipH, flipV]
  )

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
      {/* Video element */}
      <AnimatePresence mode="wait">
        {isLoading && !error ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="text-sm text-gray-400">Activation de la caméra…</span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex max-w-xs flex-col items-center gap-3 text-center"
          >
            <CameraOff className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        ) : (
          <motion.video
            key="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full object-contain"
            style={filterStyle}
          />
        )}
      </AnimatePresence>

      {/* Overlays */}
      {overlays.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {overlays.map((overlay) => (
            <OverlayRenderer key={overlay.id} overlay={overlay} />
          ))}
        </div>
      )}

      {/* Safe area hint borders (subtle) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  )
}
