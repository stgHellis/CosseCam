"use client"

import { useState, useCallback, useMemo, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import {
  QrCode,
  Copy,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCosseCamStore } from "@/store/cossecam-store"

interface QrCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QrCodeDialog({ open, onOpenChange }: QrCodeDialogProps) {
  const { sessionId } = useCosseCamStore()
  const [copied, setCopied] = useState(false)

  // Derive origin safely (no SSR hydration mismatch)
  const origin = useSyncExternalStore(
    (cb) => { window.addEventListener("popstate", cb); return () => window.removeEventListener("popstate", cb) },
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  )
  const qrUrl = useMemo(
    () => (origin ? `${origin}/?session=${sessionId}&role=viewer` : ""),
    [origin, sessionId]
  )

  const handleCopy = async () => {
    if (!qrUrl) return
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement("textarea")
      if (!qrUrl) return
      ta.value = qrUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = useCallback(() => {
    const { setSessionId } = useCosseCamStore.getState()
    const newId = Math.random().toString(36).substring(2, 11)
    setSessionId(newId)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-white/[0.08] bg-gray-950 p-0 text-white sm:max-w-sm">
        {/* Header with gradient accent */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent px-6 pb-4 pt-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                <QrCode className="h-5 w-5 text-emerald-400" />
              </div>
              Connexion par QR Code
            </DialogTitle>
            <DialogDescription className="mt-1.5 pl-[46px] text-sm text-gray-400">
              Scannez avec votre téléphone pour une connexion directe.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-5 px-6 pb-6 pt-2">
          {/* QR Code Card */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={qrUrl}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative rounded-2xl border border-white/[0.08] bg-white p-4"
              >
                {qrUrl && (
                  <QRCodeSVG
                    value={qrUrl}
                    size={200}
                    level="M"
                    includeMargin={false}
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                  />
                )}
                {/* Corner accent dots */}
                <div className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Session ID with copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                className="h-7 gap-1.5 px-2 text-xs text-gray-500 hover:text-emerald-400"
              >
                <RefreshCw className="h-3 w-3" />
                Nouvelle session
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/30 p-2.5">
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-emerald-300">
                {sessionId}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="shrink-0 text-gray-400 hover:text-emerald-400"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Steps */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Comment connecter
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                  1
                </div>
                <div>
                  <p className="text-sm text-gray-300">
                    Ouvrez l&apos;appareil photo de votre téléphone
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                  2
                </div>
                <div>
                  <p className="text-sm text-gray-300">
                    Scannez le QR code ci-dessus
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                  3
                </div>
                <div>
                  <p className="text-sm text-gray-300">
                    La connexion s&apos;établit automatiquement
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] py-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
            <span className="text-xs text-gray-500">
              Connexion chiffrée de bout en bout
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
