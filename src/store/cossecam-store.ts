"use client"

import { create } from "zustand"

export interface OverlayConfig {
  id: string
  type: "text" | "image" | "lower-third"
  content: string
  positionX: number
  positionY: number
  width: number
  height: number
  fontSize: number
  fontColor: string
  bgColor: string
  bgOpacity: number
  isVisible: boolean
  imageUrl?: string
  secondaryText?: string
}

export type AppView = "landing" | "camera"
export type ConnectionType = "wifi" | "usb"
export type Resolution = "480p" | "720p" | "1080p" | "4k"

interface CosseCamState {
  // App view
  view: AppView
  setView: (view: AppView) => void

  // Camera
  isCameraActive: boolean
  setCameraActive: (active: boolean) => void
  cameraFacing: "user" | "environment"
  toggleCameraFacing: () => void

  // Settings
  resolution: Resolution
  setResolution: (r: Resolution) => void
  frameRate: number
  setFrameRate: (fps: number) => void
  audioEnabled: boolean
  setAudioEnabled: (enabled: boolean) => void
  connectionType: ConnectionType
  setConnectionType: (ct: ConnectionType) => void

  // Video controls
  brightness: number
  setBrightness: (v: number) => void
  contrast: number
  setContrast: (v: number) => void
  saturation: number
  setSaturation: (v: number) => void
  zoom: number
  setZoom: (v: number) => void
  rotation: number
  setRotation: (deg: number) => void
  flipH: boolean
  toggleFlipH: () => void
  flipV: boolean
  toggleFlipV: () => void
  exposure: number
  setExposure: (v: number) => void
  sharpness: number
  setSharpness: (v: number) => void

  // Connection
  sessionId: string
  setSessionId: (id: string) => void
  connectionState: "disconnected" | "connecting" | "connected"
  setConnectionState: (s: "disconnected" | "connecting" | "connected") => void
  peerCount: number
  setPeerCount: (n: number) => void
  latency: number
  setLatency: (ms: number) => void

  // Overlays
  overlays: OverlayConfig[]
  addOverlay: (overlay: OverlayConfig) => void
  updateOverlay: (id: string, updates: Partial<OverlayConfig>) => void
  removeOverlay: (id: string) => void
  toggleOverlayVisibility: (id: string) => void

  // UI state
  controlsPanelOpen: boolean
  setControlsPanelOpen: (open: boolean) => void
  overlayEditorOpen: boolean
  setOverlayEditorOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  connectionPanelOpen: boolean
  setConnectionPanelOpen: (open: boolean) => void
  obsPanelOpen: boolean
  setObsPanelOpen: (open: boolean) => void

  // OBS
  obsBridgeId: string
  setObsBridgeId: (id: string) => void
  obsConnected: boolean
  setObsConnected: (connected: boolean) => void
  obsSourceCreated: boolean
  setObsSourceCreated: (created: boolean) => void

  // Reset
  resetControls: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 11)

export const useCosseCamStore = create<CosseCamState>((set) => ({
  // App view
  view: "landing",
  setView: (view) => set({ view }),

  // Camera
  isCameraActive: false,
  setCameraActive: (isCameraActive) => set({ isCameraActive }),
  cameraFacing: "user",
  toggleCameraFacing: () =>
    set((state) => ({
      cameraFacing: state.cameraFacing === "user" ? "environment" : "user",
    })),

  // Settings
  resolution: "1080p",
  setResolution: (resolution) => set({ resolution }),
  frameRate: 30,
  setFrameRate: (frameRate) => set({ frameRate }),
  audioEnabled: true,
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  connectionType: "wifi",
  setConnectionType: (connectionType) => set({ connectionType }),

  // Video controls
  brightness: 100,
  setBrightness: (brightness) => set({ brightness }),
  contrast: 100,
  setContrast: (contrast) => set({ contrast }),
  saturation: 100,
  setSaturation: (saturation) => set({ saturation }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  rotation: 0,
  setRotation: (rotation) => set({ rotation }),
  flipH: false,
  toggleFlipH: () => set((s) => ({ flipH: !s.flipH })),
  flipV: false,
  toggleFlipV: () => set((s) => ({ flipV: !s.flipV })),
  exposure: 0,
  setExposure: (exposure) => set({ exposure }),
  sharpness: 0,
  setSharpness: (sharpness) => set({ sharpness }),

  // Connection
  sessionId: generateId(),
  setSessionId: (sessionId) => set({ sessionId }),
  connectionState: "disconnected",
  setConnectionState: (connectionState) => set({ connectionState }),
  peerCount: 0,
  setPeerCount: (peerCount) => set({ peerCount }),
  latency: 0,
  setLatency: (latency) => set({ latency }),

  // Overlays
  overlays: [],
  addOverlay: (overlay) =>
    set((state) => ({ overlays: [...state.overlays, overlay] })),
  updateOverlay: (id, updates) =>
    set((state) => ({
      overlays: state.overlays.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),
  removeOverlay: (id) =>
    set((state) => ({
      overlays: state.overlays.filter((o) => o.id !== id),
    })),
  toggleOverlayVisibility: (id) =>
    set((state) => ({
      overlays: state.overlays.map((o) =>
        o.id === id ? { ...o, isVisible: !o.isVisible } : o
      ),
    })),

  // UI state
  controlsPanelOpen: false,
  setControlsPanelOpen: (controlsPanelOpen) => set({ controlsPanelOpen }),
  overlayEditorOpen: false,
  setOverlayEditorOpen: (overlayEditorOpen) => set({ overlayEditorOpen }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  connectionPanelOpen: false,
  setConnectionPanelOpen: (connectionPanelOpen) => set({ connectionPanelOpen }),
  obsPanelOpen: false,
  setObsPanelOpen: (obsPanelOpen) => set({ obsPanelOpen }),

  // OBS
  obsBridgeId: "",
  setObsBridgeId: (obsBridgeId) => set({ obsBridgeId }),
  obsConnected: false,
  setObsConnected: (obsConnected) => set({ obsConnected }),
  obsSourceCreated: false,
  setObsSourceCreated: (obsSourceCreated) => set({ obsSourceCreated }),

  // Reset
  resetControls: () =>
    set({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      zoom: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
      exposure: 0,
      sharpness: 0,
    }),
}))
