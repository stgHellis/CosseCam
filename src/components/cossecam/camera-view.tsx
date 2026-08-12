"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Wifi, WifiOff, Users, Radio, MonitorPlay } from "lucide-react"
import { useCosseCamStore } from "@/store/cossecam-store"
import { useCamera } from "@/hooks/use-camera"
import { CameraPreview } from "./camera-preview"
import { CameraToolbar } from "./camera-toolbar"
import { ControlsPanel } from "./controls-panel"
import { SettingsDialog } from "./settings-dialog"
import { ConnectionPanel } from "./connection-panel"
import { OverlayEditor } from "./overlay-editor"
import { ObsAutoConnect } from "./obs-auto-connect"

export function CameraView() {
  const {
    setView,
    connectionState,
    peerCount,
    latency,
    resolution,
    isCameraActive,
    setConnectionPanelOpen,
    setObsPanelOpen,
    obsConnected,
  } = useCosseCamStore()

  const { videoRef, isLoading, error, startCamera, stopCamera, switchCamera } =
    useCamera()

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
      {/* Top status bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-30 flex items-center justify-between border-b border-white/[0.06] bg-black/80 px-4 py-2 backdrop-blur-xl"
      >
        {/* Back button + Logo + Connection button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-bold text-white">
              Cosse<span className="text-emerald-400">Cam</span>
            </span>
          </button>

          {/* Connection button — top-left quick access */}
          <button
            onClick={() => setConnectionPanelOpen(true)}
            className={`ml-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              connectionState === "connected"
                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-white/[0.06] text-gray-400 hover:bg-white/[0.12] hover:text-white"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connexion</span>
          </button>
        </div>

        {/* Center status indicators */}
        <div className="flex items-center gap-4">
          {/* Resolution badge */}
          <span className="hidden rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-gray-400 sm:inline-block">
            {resolution.toUpperCase()}
          </span>

          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {connectionState === "connected" ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-gray-600" />
            )}
            {connectionState === "connected" && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Users className="h-3 w-3" />
                {peerCount}
              </span>
            )}
          </div>

          {/* Latency */}
          {connectionState === "connected" && latency > 0 && (
            <span className="font-mono text-xs text-gray-500">
              {latency}ms
            </span>
          )}
        </div>

        {/* OBS button — top-right */}
        <button
          onClick={() => setObsPanelOpen(true)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            obsConnected
              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-white/[0.06] text-gray-400 hover:bg-white/[0.12] hover:text-white"
          }`}
        >
          <MonitorPlay className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">OBS</span>
        </button>
      </motion.div>

      {/* Camera preview area */}
      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <CameraPreview
              videoRef={videoRef}
              isLoading={isLoading}
              error={error}
            />
          </motion.div>
        </AnimatePresence>

        {/* Toolbar (absolutely positioned over the preview) */}
        <CameraToolbar
          isCameraActive={isCameraActive}
          isLoading={isLoading}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onSwitchCamera={switchCamera}
        />
      </div>

      {/* Panels & dialogs */}
      <ControlsPanel />
      <SettingsDialog />
      <ConnectionPanel />
      <OverlayEditor />
      <ObsAutoConnect />
    </div>
  )
}
