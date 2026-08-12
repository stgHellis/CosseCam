"use client"

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCosseCamStore } from "@/store/cossecam-store"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function useIsMounted() {
  const subscribe = useCallback((callback: () => void) => {
    callback()
    return () => {}
  }, [])
  return useSyncExternalStore(subscribe, () => true, () => false)
}

function useDismissed() {
  const subscribe = useCallback((callback: () => void) => {
    callback()
    return () => {}
  }, [])
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem("cossecam-pwa-dismissed") !== null
  }, [])
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function PwaInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const { view } = useCosseCamStore()
  const isMounted = useIsMounted()
  const isDismissed = useDismissed()

  useEffect(() => {
    if (isDismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const nav = navigator as unknown as { standalone?: boolean }
    if (isIOS && !nav.standalone) {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [isDismissed])

  const handleInstall = useCallback(async () => {
    if (deferredPromptRef.current) {
      await deferredPromptRef.current.prompt()
      const { outcome } = await deferredPromptRef.current.userChoice
      if (outcome === "accepted") {
        setShowPrompt(false)
      }
      deferredPromptRef.current = null
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    sessionStorage.setItem("cossecam-pwa-dismissed", "true")
  }, [])

  if (!isMounted || isDismissed || !showPrompt || view === "camera") return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 p-4"
        >
          <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-gray-950/95 p-4 shadow-2xl backdrop-blur-xl">
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 rounded-full p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Smartphone className="h-6 w-6 text-emerald-400" />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">
                  Installer CosseCam
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  {isIOS ? (
                    <>
                      Appuyez sur <strong className="text-white">l&apos;icône de partage</strong> en bas de l&apos;écran, puis sur{" "}
                      <strong className="text-white">Ajouter à l&apos;écran d&apos;accueil</strong>.
                    </>
                  ) : (
                    "Ajoutez CosseCam à votre écran d&apos;accueil pour un accès rapide."
                  )}
                </p>

                <div className="mt-3 flex gap-2">
                  {!isIOS && (
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Installer
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-white"
                  >
                    Plus tard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
