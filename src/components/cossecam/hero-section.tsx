"use client"

import { motion } from "framer-motion"
import { Play, Wifi, Usb, Zap } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCosseCamStore } from "@/store/cossecam-store"

export function HeroSection() {
  const { setView } = useCosseCamStore()

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-black pt-16">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-600/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* Left - Text content */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-emerald-400"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Latence ultra-faible · Peer-to-Peer
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Votre téléphone devient{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              votre meilleure webcam
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400"
          >
            Transformez votre smartphone en webcam HD professionnel avec
            CosseCam. Connexion peer-to-peer, ajustements en temps réel et
            intégration native avec OBS Studio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => setView("camera")}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Play className="mr-2 h-4 w-4" />
              Commencer
            </Button>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" />
                Wi-Fi
              </span>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1.5">
                <Usb className="h-3.5 w-3.5" />
                USB
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right - Hero image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex items-center justify-center"
        >
          <div className="relative">
            {/* Glow behind image */}
            <div className="absolute -inset-4 rounded-2xl bg-emerald-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
              <Image
                src="/hero-cossecam.png"
                alt="CosseCam - Transformez votre téléphone en webcam"
                width={560}
                height={400}
                className="h-auto w-full"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
