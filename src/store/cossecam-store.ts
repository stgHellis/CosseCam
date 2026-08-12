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
export type Resolution = "144p" | "240p" | "360p" | "480p" | "720p" | "1080p" | "1440p" | "4k"
export type RecordingFormat = "webm-vp9" | "webm-vp8" | "webm-h264" | "mp4"
export type RecordingQuality = "low" | "medium" | "high" | "ultra"

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

  // USB
  usbSupported: boolean
  setUsbSupported: (v: boolean) => void
  usbDeviceName: string | null
  setUsbDeviceName: (v: string | null) => void
  usbTetheringActive: boolean
  setUsbTetheringActive: (v: boolean) => void
  usbIpAddress: string | null
  setUsbIpAddress: (v: string | null) => void
  usbDetecting: boolean
  setUsbDetecting: (v: boolean) => void

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

  // Recording settings
  recordingFormat: RecordingFormat
  setRecordingFormat: (f: RecordingFormat) => void
  recordingQuality: RecordingQuality
  setRecordingQuality: (q: RecordingQuality) => void

  // Video features
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
  recordingStartTime: number | null
  setRecordingStartTime: (time: number | null) => void
  showGrid: boolean
  toggleShowGrid: () => void
  isPipActive: boolean
  setIsPipActive: (active: boolean) => void
  showCameraInfo: boolean
  toggleShowCameraInfo: () => void
  lastScreenshotUrl: string | null
  setLastScreenshotUrl: (url: string | null) => void
  screenshotFlash: boolean
  setScreenshotFlash: (flash: boolean) => void

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

  // USB
  usbSupported: false,
  setUsbSupported: (usbSupported) => set({ usbSupported }),
  usbDeviceName: null,
  setUsbDeviceName: (usbDeviceName) => set({ usbDeviceName }),
  usbTetheringActive: false,
  setUsbTetheringActive: (usbTetheringActive) => set({ usbTetheringActive }),
  usbIpAddress: null,
  setUsbIpAddress: (usbIpAddress) => set({ usbIpAddress }),
  usbDetecting: false,
  setUsbDetecting: (usbDetecting) => set({ usbDetecting }),

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

  // Recording settings
  recordingFormat: "webm-vp9" as RecordingFormat,
  setRecordingFormat: (recordingFormat) => set({ recordingFormat }),
  recordingQuality: "high" as RecordingQuality,
  setRecordingQuality: (recordingQuality) => set({ recordingQuality }),

  // Video features
  isRecording: false,
  setIsRecording: (isRecording) => set({ isRecording }),
  recordingStartTime: null,
  setRecordingStartTime: (recordingStartTime) => set({ recordingStartTime }),
  showGrid: false,
  toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  isPipActive: false,
  setIsPipActive: (isPipActive) => set({ isPipActive }),
  showCameraInfo: true,
  toggleShowCameraInfo: () => set((s) => ({ showCameraInfo: !s.showCameraInfo })),
  lastScreenshotUrl: null,
  setLastScreenshotUrl: (lastScreenshotUrl) => set({ lastScreenshotUrl }),
  screenshotFlash: false,
  setScreenshotFlash: (screenshotFlash) => set({ screenshotFlash }),

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
