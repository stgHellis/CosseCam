"use client"

import { motion } from "framer-motion"
import {
  Copy,
  CheckCircle2,
  Zap,
  MonitorPlay,
  ArrowRight,
} from "lucide-react"
import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { useCosseCamStore } from "@/store/cossecam-store"

const emptySubscribe = (cb: () => void) => { cb(); return () => {} }

export function ObsSection() {
  const { sessionId, setView } = useCosseCamStore()
  const [copied, setCopied] = useState(false)

  const origin = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  )
  const streamUrl = origin ? `${origin}/api/stream/${sessionId}` : ""

  const handleCopy = async () => {
    if (!streamUrl) return
    try {
      await navigator.clipboard.writeText(streamUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = streamUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGoToCamera = () => {
    setView("camera")
    // Open OBS panel after a short delay (view switch animation)
    setTimeout(() => {
      useCosseCamStore.getState().setObsPanelOpen(true)
    }, 500)
  }

  return (
    <section id="obs" className="relative bg-black py-24 sm:py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Intégration OBS Studio
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Connectez CosseCam à OBS Studio en un seul clic — aucun copier-coller requis.
          </p>
        </motion.div>

        {/* Auto-connect hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20">
                <Zap className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-semibold text-white">
                  Connexion automatique OBS
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  CosseCam crée automatiquement une source de navigateur dans votre scène OBS active.
                  Activez le serveur WebSocket dans <strong className="text-gray-300">OBS → Paramètres → Réseau</strong>,
                  puis cliquez sur le bouton ci-dessous.
                </p>
                <Button
                  onClick={handleGoToCamera}
                  className="mt-5 gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <MonitorPlay className="h-4 w-4" />
                  Ouvrir le panneau OBS
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Manual fallback — collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        >
          <details className="group">
            <summary className="cursor-pointer p-6 sm:p-8">
              <p className="text-sm font-medium text-gray-400 group-open:text-gray-300">
                Ou configurer manuellement (méthode classique)
              </p>
            </summary>

            <div className="border-t border-white/[0.06]">
              {/* Step 1 */}
              <div className="border-b border-white/[0.06] p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-gray-400">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      Ouvrez OBS Studio
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Lancez OBS Studio sur votre ordinateur de streaming.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border-b border-white/[0.06] p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-gray-400">
                    2
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">
                      Ajoutez une source de navigateur
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Dans le panneau « Sources », cliquez sur le « + » puis
                      sélectionnez « Capture de navigateur ».
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 - URL */}
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-gray-400">
                    3
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">
                      Collez l'URL du flux
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Copiez l'URL ci-dessous et collez-la dans le champ URL de la
                      source de navigateur.
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/50 p-3">
                      <code className="min-w-0 flex-1 truncate text-sm text-gray-300">
                        {streamUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        className="shrink-0 text-gray-400 hover:text-gray-200"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center"
        >
          <p className="text-sm text-amber-300/80">
            <strong className="text-amber-300">Astuce :</strong> Assurez-vous
            que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi
            pour une latence minimale.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
