"use client"

import { motion } from "framer-motion"
import {
  CameraOff,
  RefreshCw,
  SlidersHorizontal,
  Settings,
  Wifi,
  WifiOff,
  Type,
  MonitorPlay,
  Camera,
  Circle,
  Square,
  Grid3X3,
  PictureInPicture2,
  Maximize,
  Info,
} from "lucide-react"
import { useCosseCamStore } from "@/store/cossecam-store"

interface CameraToolbarProps {
  isCameraActive: boolean
  isLoading: boolean
  onStartCamera: () => void
  onStopCamera: () => void
  onSwitchCamera: () => void
  onTakeScreenshot?: () => void
  onToggleRecording?: () => void
  onTogglePip?: () => void
  onToggleFullscreen?: () => void
}

export function CameraToolbar({
  isCameraActive,
  isLoading,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onTakeScreenshot,
  onToggleRecording,
  onTogglePip,
  onToggleFullscreen,
}: CameraToolbarProps) {
  const {
    connectionState,
    controlsPanelOpen,
    setControlsPanelOpen,
    settingsOpen,
    setSettingsOpen,
    connectionPanelOpen,
    setConnectionPanelOpen,
    overlayEditorOpen,
    setOverlayEditorOpen,
    obsPanelOpen,
    setObsPanelOpen,
    obsConnected,
    isRecording,
    showGrid,
    toggleShowGrid,
    showCameraInfo,
    toggleShowCameraInfo,
  } = useCosseCamStore()

  const isConnected = connectionState === "connected"

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="absolute inset-x-0 bottom-0 z-30"
    >
      {/* Gradient backdrop */}
      <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-6 pt-16 sm:px-6">
        {/* Top row: secondary actions */}
        {isCameraActive && (
          <div className="mx-auto mb-4 flex max-w-lg items-center justify-center gap-2">
            <ToolbarButton
              active={showGrid}
              onClick={toggleShowGrid}
              tooltip="Grille de composition"
            >
              <Grid3X3 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              active={showCameraInfo}
              onClick={toggleShowCameraInfo}
              tooltip="Infos caméra"
            >
              <Info className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={onTogglePip}
              tooltip="Image dans l'image"
              disabled={!isCameraActive}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={onToggleFullscreen}
              tooltip="Plein écran"
              disabled={!isCameraActive}
            >
              <Maximize className="h-4 w-4" />
            </ToolbarButton>
          </div>
        )}

        {/* Main toolbar row */}
        <div className="mx-auto flex max-w-lg items-center justify-center gap-3">
          {/* Connection toggle */}
          <ToolbarButton
            active={connectionPanelOpen}
            onClick={() => setConnectionPanelOpen(!connectionPanelOpen)}
            tooltip={isConnected ? "Connecté" : "Connexion"}
          >
            {isConnected ? (
              <Wifi className="h-5 w-5 text-emerald-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400" />
            )}
          </ToolbarButton>

          {/* Screenshot */}
          <ToolbarButton
            onClick={onTakeScreenshot}
            disabled={!isCameraActive}
            tooltip="Capture d'écran"
          >
            <Camera className="h-5 w-5" />
          </ToolbarButton>

          {/* Camera switch */}
          <ToolbarButton
            onClick={onSwitchCamera}
            disabled={!isCameraActive || isLoading}
            tooltip="Retourner la caméra"
          >
            <RefreshCw className="h-5 w-5" />
          </ToolbarButton>

          {/* Main camera button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={isCameraActive ? onStopCamera : onStartCamera}
            disabled={isLoading}
            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 transition-colors disabled:opacity-50 ${
              isCameraActive
                ? "border-red-500/50 bg-red-500/20 text-red-400 hover:border-red-400 hover:bg-red-500/30"
                : "border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/30"
            }`}
          >
            {isCameraActive ? (
              <CameraOff className="h-6 w-6" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-current" />
            )}
          </motion.button>

          {/* Recording */}
          <ToolbarButton
            active={isRecording}
            onClick={onToggleRecording}
            disabled={!isCameraActive}
            tooltip={isRecording ? "Arrêter l'enregistrement" : "Enregistrer"}
          >
            {isRecording ? (
              <Square className="h-4 w-4 fill-red-500 text-red-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </ToolbarButton>

          {/* OBS auto-connect */}
          <ToolbarButton
            active={obsPanelOpen}
            onClick={() => setObsPanelOpen(!obsPanelOpen)}
            tooltip="OBS Studio"
          >
            <MonitorPlay className={`h-5 w-5 ${obsConnected ? "text-emerald-400" : ""}`} />
          </ToolbarButton>

          {/* Controls panel */}
          <ToolbarButton
            active={controlsPanelOpen}
            onClick={() => setControlsPanelOpen(!controlsPanelOpen)}
            tooltip="Ajustements"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </ToolbarButton>

          {/* More menu - opens a small popup with settings & overlays */}
          <ToolbarButton
            active={settingsOpen || overlayEditorOpen}
            onClick={() => {
              if (!isCameraActive) {
                setSettingsOpen(!settingsOpen)
              } else {
                // Toggle between settings and overlays
                if (overlayEditorOpen) {
                  setOverlayEditorOpen(false)
                } else if (settingsOpen) {
                  setSettingsOpen(false)
                  setOverlayEditorOpen(true)
                } else {
                  setSettingsOpen(true)
                }
              }
            }}
            tooltip="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </ToolbarButton>
        </div>

        {/* Overlay quick-toggle (only when camera is active) */}
        {isCameraActive && (
          <div className="mx-auto mt-3 flex max-w-lg justify-center">
            <button
              onClick={() => setOverlayEditorOpen(!overlayEditorOpen)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                overlayEditorOpen
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
              }`}
            >
              <Type className="h-3 w-3" />
              Surpositions
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled = false,
  active = false,
  tooltip,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  tooltip: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors disabled:opacity-30 disabled:pointer-events-none ${
        active
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}
