"use client"

import { useState } from "react"
import { Camera, Github, Twitter, Smartphone, Monitor, HelpCircle } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Smartphone className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Installer CosseCam sur votre téléphone
                </p>
                <p className="text-xs text-gray-500">
                  Guide d&apos;installation pour Android &amp; iOS
                </p>
              </div>
            </div>
            <HelpCircle className="h-5 w-5 shrink-0 text-gray-500" />
          </button>

          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InstallGuideCard
                  icon={<Monitor className="h-4 w-4 text-emerald-400" />}
                  title="Android (Chrome)"
                  steps={[
                    "Ouvrez Google Chrome sur votre téléphone",
                    "Allez sur l'adresse de CosseCam dans la barre d'URL",
                    "Appuyez sur le menu ⋮ (3 points en haut à droite)",
                    "Appuyez sur Ajouter à l'écran d'accueil",
                    "Confirmez avec Ajouter. CosseCam apparaît !",
                  ]}
                  tip="OPPO Reno 6 (ColorOS) : Le menu est accessible via le bouton ⋮ ou en swipant vers le haut depuis la barre de navigation Chrome."
                />
                <InstallGuideCard
                  icon={<Smartphone className="h-4 w-4 text-emerald-400" />}
                  title="iPhone & iPad (Safari)"
                  steps={[
                    "Ouvrez Safari (obligatoire, pas Chrome)",
                    "Allez sur l'adresse de CosseCam",
                    "Appuyez sur l'icône Partager (carré avec flèche ↑)",
                    "Faites défiler et appuyez sur Sur l'écran d'accueil",
                    "Appuyez sur Ajouter. L'application apparaît !",
                  ]}
                />
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Bon à savoir
                </h4>
                <ul className="flex flex-col gap-1.5 text-xs text-gray-500">
                  <li>• CosseCam fonctionne sans installation — utilisez-le directement dans le navigateur</li>
                  <li>• Une fois installé, l'application s'ouvre sans barre d'adresse, comme une vraie app</li>
                  <li>• L'accès à la caméra et au microphone sera demandé au premier lancement</li>
                  <li>• Assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau Wi-Fi</li>
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Cosse<span className="text-emerald-400">Cam</span>
            </span>
          </div>
          <p className="text-center text-xs text-gray-500">
            {new Date().getFullYear()} CosseCam. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 transition-colors hover:text-white" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-500 transition-colors hover:text-white" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function InstallGuideCard({
  icon,
  title,
  steps,
  tip,
}: {
  icon: React.ReactNode
  title: string
  steps: string[]
  tip?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <ol className="flex flex-col gap-2.5 text-xs leading-relaxed text-gray-400">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {tip && (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-[11px] text-amber-300/80">
            <strong className="text-amber-300">{title.split(" (")[0]} :</strong> {tip}
          </p>
        </div>
      )}
    </div>
  )
}
