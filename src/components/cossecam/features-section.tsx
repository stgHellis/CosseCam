"use client"

import { motion } from "framer-motion"
import {
  Smartphone,
  Wifi,
  Monitor,
  SlidersHorizontal,
  Radio,
  Lock,
  Zap,
  Layers,
} from "lucide-react"

const features = [
  {
    icon: Smartphone,
    title: "Qualité HD supérieure",
    description:
      "Profitez de la résolution de votre smartphone jusqu\'en 4K. Bien supérieur à n\'importe quelle webcam classique.",
  },
  {
    icon: Zap,
    title: "Latence ultra-faible",
    description:
      "Connexion WebRTC peer-to-peer pour un flux vidéo en temps réel avec une latence minimale.",
  },
  {
    icon: Wifi,
    title: "Wi-Fi ou USB",
    description:
      "Connectez-vous via votre réseau Wi-Fi local ou par câble USB pour une stabilité maximale.",
  },
  {
    icon: Monitor,
    title: "Compatible OBS Studio",
    description:
      "Intégration native avec OBS Studio via un flux vidéo standard. Aucun plugin requis.",
  },
  {
    icon: SlidersHorizontal,
    title: "Ajustements en temps réel",
    description:
      "Luminosité, contraste, saturation, zoom et rotation — tout est ajustable en direct.",
  },
  {
    icon: Layers,
    title: "Surpositions personnalisées",
    description:
      "Ajoutez du texte, des images et des bandes défilantes directement sur votre flux vidéo.",
  },
  {
    icon: Radio,
    title: "Audio intégré",
    description:
      "Utilisez le microphone de votre téléphone pour un son clair et synchronisé avec la vidéo.",
  },
  {
    icon: Lock,
    title: "Connexion sécurisée",
    description:
      "Chiffrement de bout en bout. Votre flux vidéo ne transite jamais par un serveur tiers.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-black py-24 sm:py-32">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            CosseCam regroupe toutes les fonctionnalités pour transformer votre
            téléphone en webcam professionnelle.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
