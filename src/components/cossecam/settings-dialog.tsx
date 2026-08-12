"use client"

import {
  Settings,
  Monitor,
  Clapperboard,
  Mic,
  MicOff,
  Wifi,
  Usb,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCosseCamStore, type Resolution, type ConnectionType } from "@/store/cossecam-store"

const RESOLUTIONS: { value: Resolution; label: string; description: string }[] = [
  { value: "480p", label: "480p", description: "640×480 — Économique" },
  { value: "720p", label: "720p", description: "1280×720 — HD" },
  { value: "1080p", label: "1080p", description: "1920×1080 — Full HD" },
  { value: "4k", label: "4K", description: "3840×2160 — Ultra HD" },
]

const FRAME_RATES = [15, 24, 30, 60]

export function SettingsDialog() {
  const {
    settingsOpen,
    setSettingsOpen,
    resolution,
    setResolution,
    frameRate,
    setFrameRate,
    audioEnabled,
    setAudioEnabled,
    connectionType,
    setConnectionType,
  } = useCosseCamStore()

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-md border-white/10 bg-gray-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="h-4 w-4 text-emerald-400" />
            Paramètres
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Configurez la résolution, le débit d'images et la connexion.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Resolution */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-300">
              <Monitor className="h-3.5 w-3.5 text-gray-500" />
              Résolution
            </Label>
            <Select
              value={resolution}
              onValueChange={(v) => setResolution(v as Resolution)}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-gray-950">
                {RESOLUTIONS.map((r) => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                    className="text-gray-300 focus:bg-emerald-500/10 focus:text-white"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{r.label}</span>
                      <span className="text-xs text-gray-500">{r.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frame Rate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-gray-300">
              <Clapperboard className="h-3.5 w-3.5 text-gray-500" />
              Débit d'images (FPS)
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {FRAME_RATES.map((fps) => (
                <button
                  key={fps}
                  onClick={() => setFrameRate(fps)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    frameRate === fps
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {fps}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Audio */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm text-gray-300">
              {audioEnabled ? (
                <Mic className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <MicOff className="h-3.5 w-3.5 text-gray-500" />
              )}
              Audio
            </Label>
            <Switch
              checked={audioEnabled}
              onCheckedChange={setAudioEnabled}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Connection Type */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Type de connexion</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConnectionType("wifi")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  connectionType === "wifi"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <Wifi className="h-5 w-5" />
                <span className="text-sm font-medium">Wi-Fi</span>
                <span className="text-xs opacity-60">Réseau local</span>
              </button>
              <button
                onClick={() => setConnectionType("usb")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  connectionType === "usb"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <Usb className="h-5 w-5" />
                <span className="text-sm font-medium">USB</span>
                <span className="text-xs opacity-60">Câble</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
