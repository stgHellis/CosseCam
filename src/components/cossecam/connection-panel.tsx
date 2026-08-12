"use client"

import { useEffect, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wifi,
  WifiOff,
  Copy,
  CheckCircle2,
  Users,
  Activity,
  Radio,
  Loader2,
  QrCode,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCosseCamStore } from "@/store/cossecam-store"
import { useConnection } from "@/hooks/use-connection"
import { QrCodeDialog } from "./qr-code-dialog"

export function ConnectionPanel() {
  const {
    connectionPanelOpen,
    setConnectionPanelOpen,
    connectionState,
    sessionId,
    peerCount,
    latency,
  } = useCosseCamStore()

  const { connect, disconnect, measureLatency } = useConnection()
  const [copied, setCopied] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const handleConnect = useCallback(() => {
    connect()
  }, [connect])

  const handleDisconnect = useCallback(() => {
    disconnect()
  }, [disconnect])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = sessionId
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Auto-measure latency when connected
  useEffect(() => {
    if (connectionState === "connected") {
      const timer = setTimeout(() => measureLatency(), 1000)
      return () => clearTimeout(timer)
    }
  }, [connectionState, measureLatency])

  const stateConfig = {
    disconnected: {
      label: "Déconnecté",
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
      icon: WifiOff,
    },
    connecting: {
      label: "Connexion en cours…",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      icon: Loader2,
    },
    connected: {
      label: "Connecté",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      icon: Wifi,
    },
  }

  const state = stateConfig[connectionState]
  const StateIcon = state.icon

  return (
    <Sheet open={connectionPanelOpen} onOpenChange={setConnectionPanelOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t border-white/10 bg-gray-950"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Radio className="h-4 w-4 text-emerald-400" />
            Connexion
          </SheetTitle>
          <SheetDescription className="text-gray-500">
            Gérez la connexion entre votre téléphone et l'ordinateur.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 pt-4 pb-4">
          {/* Status card */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${state.bgColor} ${state.borderColor}`}
          >
            <StateIcon
              className={`h-5 w-5 ${state.color} ${
                connectionState === "connecting" ? "animate-spin" : ""
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${state.color}`}>{
                state.label
              }</p>
              <p className="text-xs text-gray-500">
                {connectionState === "connected"
                  ? `${peerCount} appareil${peerCount > 1 ? "s" : ""} connecté${peerCount > 1 ? "s" : ""}`
                  : "Aucun appareil connecté"}
              </p>
            </div>
          </div>

          {/* Session ID */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Identifiant de session
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 p-3">
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-emerald-300">
                {sessionId}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="shrink-0 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              Partagez cet identifiant avec l'ordinateur récepteur.
            </p>
          </div>

          {/* QR Code Button */}
          <Button
            onClick={() => setQrDialogOpen(true)}
            variant="outline"
            className="w-full gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200"
          >
            <QrCode className="h-4 w-4" />
            Afficher le QR Code de connexion
          </Button>

          <Separator className="bg-white/[0.06]" />

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Appareils</span>
              </div>
              <p className="mt-1 font-mono text-lg font-semibold text-white">
                {peerCount}
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-xs">Latence</span>
              </div>
              <p className="mt-1 font-mono text-lg font-semibold text-white">
                {latency > 0 ? `${latency}ms` : "—"}
              </p>
            </div>
          </div>

          {/* Connect / Disconnect button */}
          <AnimatePresence mode="wait">
            {connectionState === "disconnected" ? (
              <motion.div
                key="connect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={handleConnect}
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <Wifi className="mr-2 h-4 w-4" />
                  Se connecter
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="disconnect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <WifiOff className="mr-2 h-4 w-4" />
                  Se déconnecter
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>

      <QrCodeDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} />
    </Sheet>
  )
}
