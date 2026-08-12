"use client"

import { useState, useCallback, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MonitorPlay,
  Plug,
  Unplug,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCosseCamStore } from "@/store/cossecam-store"

const BRIDGE_PORT = 3005

// Safe origin (no hydration mismatch)
const emptySubscribe = (cb: () => void) => { cb(); return () => {} }
function useOrigin() {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  )
}

type ObsStep = "idle" | "detecting" | "connecting" | "creating" | "connected" | "error"

export function ObsAutoConnect() {
  const {
    obsPanelOpen,
    setObsPanelOpen,
    sessionId,
    obsBridgeId,
    setObsBridgeId,
    obsConnected,
    setObsConnected,
    obsSourceCreated,
    setObsSourceCreated,
    isCameraActive,
    connectionState,
  } = useCosseCamStore()

  const origin = useOrigin()
  const streamUrl = origin ? `${origin}/api/stream/${sessionId}` : ""

  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState("4455")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<ObsStep>("idle")
  const [error, setError] = useState("")
  const [obsDetected, setObsDetected] = useState(false)
  const [sceneName, setSceneName] = useState("")

  const sourceName = "CosseCam"

  const resetState = useCallback(() => {
    setStep("idle")
    setError("")
    setObsConnected(false)
    setObsSourceCreated(false)
    setObsBridgeId("")
    setSceneName("")
  }, [setObsConnected, setObsSourceCreated, setObsBridgeId])

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    const url = `/?XTransformPort=${BRIDGE_PORT}${path}`
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    })
    return res.json()
  }, [])

  // Detect OBS
  const handleDetect = useCallback(async () => {
    setStep("detecting")
    setError("")
    try {
      const data = await apiFetch("/api/detect")
      if (data.found) {
        setObsDetected(true)
        setHost(data.host)
        setPort(String(data.port))
      } else {
        setObsDetected(false)
        setError("OBS Studio introuvable. Vérifiez qu'il est lancé et que le serveur WebSocket est activé dans Paramètres → Réseau.")
      }
      setStep("idle")
    } catch {
      setStep("idle")
      setError("Impossible de contacter le service OBS. Réessayez.")
    }
  }, [apiFetch])

  // Full 1-click: detect → connect → create source
  const handleOneClick = useCallback(async () => {
    setError("")
    setSceneName("")

    // Step 1: Connect to OBS
    setStep("connecting")
    try {
      const connectData = await apiFetch("/api/connect", {
        method: "POST",
        body: JSON.stringify({ host, port: Number(port), password }),
      })
      if (!connectData.success) {
        setStep("error")
        setError(connectData.error || "Connexion échouée")
        return
      }
      setObsBridgeId(connectData.bridgeId)
      setObsConnected(true)
    } catch {
      setStep("error")
      setError("Impossible de se connecter à OBS. Vérifiez l'hôte et le port.")
      return
    }

    // Step 2: Create browser source
    setStep("creating")
    try {
      const addData = await apiFetch("/api/add-source", {
        method: "POST",
        body: JSON.stringify({
          bridgeId: useCosseCamStore.getState().obsBridgeId,
          url: streamUrl,
          sourceName,
          width: 1920,
          height: 1080,
        }),
      })
      if (!addData.success) {
        setStep("error")
        setError(addData.error || "Impossible de créer la source")
        return
      }
      setSceneName(addData.sceneName)
      setObsSourceCreated(true)
      setStep("connected")
    } catch {
      setStep("error")
      setError("Erreur lors de la création de la source dans OBS.")
    }
  }, [apiFetch, host, port, password, streamUrl, setObsBridgeId, setObsConnected, setObsSourceCreated])

  // Disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      const bridgeId = useCosseCamStore.getState().obsBridgeId
      if (bridgeId) {
        await apiFetch("/api/disconnect", {
          method: "POST",
          body: JSON.stringify({ bridgeId }),
        })
      }
    } catch { /* ignore */ }
    resetState()
  }, [apiFetch, resetState])

  // Remove source from OBS
  const handleRemoveSource = useCallback(async () => {
    const bridgeId = useCosseCamStore.getState().obsBridgeId
    if (!bridgeId) return
    try {
      await apiFetch("/api/remove-source", {
        method: "POST",
        body: JSON.stringify({ bridgeId, sourceName, sceneName }),
      })
      setObsSourceCreated(false)
      setSceneName("")
    } catch { /* ignore */ }
  }, [apiFetch, sourceName, sceneName, setObsSourceCreated])

  const isWorking = step === "detecting" || step === "connecting" || step === "creating"

  return (
    <Sheet open={obsPanelOpen} onOpenChange={setObsPanelOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t border-white/10 bg-gray-950"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <MonitorPlay className="h-4 w-4 text-emerald-400" />
            Intégration OBS Studio
          </SheetTitle>
          <SheetDescription className="text-gray-500">
            Connexion automatique — aucun copier-coller requis.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 pt-4 pb-4">
          {/* Status indicator */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
              step === "connected"
                ? "border-emerald-500/20 bg-emerald-500/10"
                : step === "error"
                  ? "border-red-500/20 bg-red-500/10"
                  : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            {step === "connected" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : step === "error" ? (
              <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            ) : isWorking ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />
            ) : (
              <MonitorPlay className="h-5 w-5 shrink-0 text-gray-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${
                step === "connected"
                  ? "text-emerald-400"
                  : step === "error"
                    ? "text-red-400"
                    : "text-gray-300"
              }`}>
                {step === "connected"
                  ? "CosseCam est connecté à OBS"
                  : step === "error"
                    ? "Erreur"
                    : isWorking
                      ? "Connexion en cours…"
                      : "Non connecté"}
              </p>
              {step === "connected" && sceneName && (
                <p className="text-xs text-gray-500">
                  Source « {sourceName} » dans la scène « {sceneName} »
                </p>
              )}
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && step === "error" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs leading-relaxed text-red-300">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection settings (hidden when connected) */}
          {step !== "connected" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paramètres OBS
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs text-gray-400">Hôte</label>
                  <Input
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost"
                    disabled={isWorking}
                    className="border-white/[0.08] bg-black/30 text-sm text-white placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Port</label>
                  <Input
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="4455"
                    disabled={isWorking}
                    className="border-white/[0.08] bg-black/30 text-sm text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="mb-1 block text-xs text-gray-400">Mot de passe (si configuré)</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Laisser vide si aucun"
                  disabled={isWorking}
                  className="border-white/[0.08] bg-black/30 pr-10 text-sm text-white placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[30px] text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Separator className="bg-white/[0.06]" />

          {/* Action buttons */}
          <AnimatePresence mode="wait">
            {step === "connected" ? (
              <motion.div
                key="connected-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <Button
                  onClick={handleRemoveSource}
                  variant="outline"
                  className="w-full border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Retirer la source CosseCam d'OBS
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  Déconnecter d'OBS
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="connect-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <Button
                  onClick={handleDetect}
                  variant="outline"
                  disabled={isWorking}
                  className="w-full gap-2 border-white/[0.08] text-gray-300 hover:bg-white/[0.06] hover:text-white"
                >
                  {step === "detecting" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {obsDetected ? "Re-détecter OBS" : "Détecter OBS automatiquement"}
                </Button>
                <Button
                  onClick={handleOneClick}
                  disabled={isWorking || !isCameraActive || connectionState !== "connected"}
                  className="w-full gap-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isWorking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isWorking
                    ? step === "connecting"
                      ? "Connexion à OBS…"
                      : "Création de la source…"
                    : "Connexion automatique en un clic"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prerequisites note */}
          {!isCameraActive && step !== "connected" && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-300/80">
                <strong className="text-amber-300">Requis :</strong> Démarrez la caméra et connectez au moins un appareil avant d'intégrer OBS.
              </p>
            </div>
          )}

          {isCameraActive && connectionState !== "connected" && step !== "connected" && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-300/80">
                <strong className="text-amber-300">Requis :</strong> Connectez un appareil via le panneau Connexion ou le QR code.
              </p>
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] py-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
            <span className="text-xs text-gray-500">
              Communication locale sécurisée via WebSocket
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
