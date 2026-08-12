"use client"

import { motion } from "framer-motion"
import { Smartphone, Link, Monitor } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Ouvrez CosseCam sur votre téléphone",
    description:
      "Lancez l'application et autorisez l'accès à la caméra. Choisissez votre résolution préférée.",
  },
  {
    number: "02",
    icon: Link,
    title: "Connectez vos appareils",
    description:
      "Scannez le code de session ou entrez l'identifiant manuellement. Les deux appareils doivent être sur le même réseau Wi-Fi ou connectés par USB.",
  },
  {
    number: "03",
    icon: Monitor,
    title: "Utilisez le flux dans OBS",
    description:
      "Dans OBS Studio, ajoutez une source « Capture de navigateur » avec l'URL du flux. C'est tout — vous êtes en direct !",
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative bg-black py-24 sm:py-32"
    >
      {/* Background dot pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
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
            Comment ça marche
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Trois étapes simples pour commencer à diffuser en haute qualité.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mt-20">
          {/* Vertical line connector (desktop) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-px bg-gradient-to-b from-emerald-500/40 via-emerald-500/20 to-transparent lg:block" />

          <div className="flex flex-col gap-16 lg:gap-20">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isLeft = index % 2 === 0
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className={`relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-12 ${
                    isLeft ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content card */}
                  <div
                    className={`w-full lg:w-[calc(50%-3rem)] ${
                      isLeft ? "lg:text-right" : "lg:text-left"
                    }`}
                  >
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
                      <span className="mb-3 inline-block font-mono text-xs font-bold tracking-wider text-emerald-400">
                        ÉTAPE {step.number}
                      </span>
                      <h3 className="mb-3 text-xl font-semibold text-white">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center icon on desktop */}
                  <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-black">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden w-[calc(50%-3rem)] lg:block" />

                  {/* Mobile icon */}
                  <div className="flex lg:hidden">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-black">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
