"use client"

import {
  Settings,
  Monitor,
  Clapperboard,
  Mic,
  MicOff,
  Wifi,
  Usb,
  Cable,
  Film,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useCosseCamStore,
  type Resolution,
  type RecordingFormat,
  type RecordingQuality,
} from "@/store/cossecam-store"
import { useUsbConnection } from "@/hooks/use-usb-connection"

const RESOLUTIONS: { value: Resolution; label: string; description: string; tier?: string }[] = [
  { value: "144p", label: "144p", description: "256×144 — Minimal", tier: "SD" },
  { value: "240p", label: "240p", description: "426×240 — Bas débit", tier: "SD" },
  { value: "360p", label: "360p", description: "640×360 — Compact", tier: "SD" },
  { value: "480p", label: "480p", description: "640×480 — Économique", tier: "SD" },
  { value: "720p", label: "720p HD", description: "1280×720 — Haute définition", tier: "HD" },
  { value: "1080p", label: "1080p FHD", description: "1920×1080 — Full HD", tier: "FHD" },
  { value: "1440p", label: "1440p QHD", description: "2560×1440 — Quad HD", tier: "QHD" },
  { value: "4k", label: "4K UHD", description: "3840×2160 — Ultra HD", tier: "UHD" },
]

const FRAME_RATES = [15, 24, 30, 60]

const RECORDING_FORMATS: { value: RecordingFormat; label: string; codec: string; description: string }[] = [
  { value: "webm-vp9", label: "WebM VP9", codec: "VP9 + Opus", description: "Meilleure qualité, Chrome/Firefox" },
  { value: "webm-vp8", label: "WebM VP8", codec: "VP8 + Opus", description: "Bonne compatibilité" },
  { value: "webm-h264", label: "WebM H.264", codec: "H.264 + Opus", description: "Compatible lecteurs" },
  { value: "mp4", label: "MP4", codec: "H.264", description: "Partage et montage" },
]

const RECORDING_QUALITIES: { value: RecordingQuality; label: string; bitrate: string; description: string }[] = [
  { value: "low", label: "Faible", bitrate: "0.5 Mbps", description: "Fichier léger" },
  { value: "medium", label: "Moyen", bitrate: "1.5 Mbps", description: "Équilibré" },
  { value: "high", label: "Élevé", bitrate: "2.5 Mbps", description: "Haute qualité" },
  { value: "ultra", label: "Ultra", bitrate: "5 Mbps", description: "Qualité maximale" },
]

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
    recordingFormat,
    setRecordingFormat,
    recordingQuality,
    setRecordingQuality,
    usbSupported,
    usbDeviceName,
    usbTetheringActive,
    usbDetecting,
  } = useCosseCamStore()

  const { requestUsbDevice } = useUsbConnection()

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-md border-white/10 bg-gray-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="h-4 w-4 text-emerald-400" />
            Paramètres
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Résolution, FPS, enregistrement et connexion.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-1">
          <div className="flex flex-col gap-5 pb-2 pt-1">
            {/* ─── Résolution ─────────────────────────────── */}
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
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{r.label}</span>
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {r.tier}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ─── Débit d'images ──────────────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-gray-300">
                <Clapperboard className="h-3.5 w-3.5 text-gray-500" />
                Débit d&apos;images (FPS)
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

            {/* ─── Format d'enregistrement ─────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-gray-300">
                <Film className="h-3.5 w-3.5 text-gray-500" />
                Format d&apos;enregistrement
              </Label>
              <Select
                value={recordingFormat}
                onValueChange={(v) => setRecordingFormat(v as RecordingFormat)}
              >
                <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-gray-950">
                  {RECORDING_FORMATS.map((f) => (
                    <SelectItem
                      key={f.value}
                      value={f.value}
                      className="text-gray-300 focus:bg-emerald-500/10 focus:text-white"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-[10px] text-gray-500">{f.codec}</span>
                        </div>
                        <span className="text-right text-xs text-gray-500">
                          {f.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ─── Qualité d'enregistrement ────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm text-gray-300">
                <Gauge className="h-3.5 w-3.5 text-gray-500" />
                Qualité d&apos;enregistrement
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {RECORDING_QUALITIES.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setRecordingQuality(q.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 transition-colors ${
                      recordingQuality === q.value
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-sm font-medium">{q.label}</span>
                    <span className="text-[10px] opacity-60">{q.bitrate}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* ─── Audio ──────────────────────────────────── */}
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

            {/* ─── Type de connexion ───────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Type de connexion</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConnectionType("wifi")}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    connectionType === "wifi"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/5"
                  }`}>
                  <Wifi className="h-5 w-5" />
                  <span className="text-sm font-medium">Wi-Fi</span>
                  <span className="text-xs opacity-60">Réseau local</span>
                </button>
                <button
                  onClick={() => {
                    setConnectionType("usb")
                    if (usbSupported && !usbDeviceName) {
                      requestUsbDevice()
                    }
                  }}
                  disabled={!usbSupported}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    !usbSupported
                      ? "cursor-not-allowed border-white/10 bg-white/[0.02] text-gray-600 opacity-40"
                      : connectionType === "usb"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:bg-white/5"
                  }`}>
                  <div className="relative">
                    <Usb className="h-5 w-5" />
                    {usbDetecting && (
                      <Loader2 className="absolute -right-1.5 -top-1.5 h-3 w-3 animate-spin text-amber-400" />
                    )}
                    {usbTetheringActive && (
                      <CheckCircle2 className="absolute -right-1.5 -top-1.5 h-3 w-3 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-sm font-medium">USB</span>
                  {usbDeviceName ? (
                    <span className="max-w-[120px] truncate rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                      {usbDeviceName}
                    </span>
                  ) : usbTetheringActive ? (
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                      <Cable className="mr-0.5 inline h-2.5 w-2.5" />
                      Tethering actif
                    </span>
                  ) : !usbSupported ? (
                    <span className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                      <AlertCircle className="h-2.5 w-2.5" />
                      Non supporté
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500">
                      Câble USB
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
