"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCosseCamStore } from "@/store/cossecam-store"
import { useQRConnect } from "@/hooks/use-qr-connect"
import { Header } from "./header"
import { LandingPage } from "./landing-page"
import { CameraView } from "./camera-view"
import { PwaInstallPrompt } from "./pwa-install-prompt"

export function CosseCamApp() {
  const view = useCosseCamStore((s) => s.view)

  // Auto-connect when opened via QR code scan
  useQRConnect()

  return (
    <div className="dark min-h-screen bg-black text-white">
      {view === "landing" && <Header />}
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage />
          </motion.div>
        ) : (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
          >
            <CameraView />
          </motion.div>
        )}
      </AnimatePresence>
      <PwaInstallPrompt />
    </div>
  )
}
