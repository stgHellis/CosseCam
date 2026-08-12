"use client"

import { motion } from "framer-motion"
import { Camera, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCosseCamStore } from "@/store/cossecam-store"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { view, setView, isCameraActive } = useCosseCamStore()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => setView("landing")}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Cosse<span className="text-emerald-400">Cam</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("features")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Fonctionnalités
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("how-it-works")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            Comment ça marche
          </a>
          <a
            href="#obs"
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById("obs")
              el?.scrollIntoView({ behavior: "smooth" })
            }}
            className="text-sm text-gray-400 transition-colors hover:text-white"
          >
            OBS Studio
          </a>
          <Button
            onClick={() => setView(isCameraActive ? "camera" : "camera")}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            <Camera className="mr-2 h-4 w-4" />
            {isCameraActive ? "Retour à la caméra" : "Démarrer"}
          </Button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/10 bg-black/95 md:hidden"
        >
          <div className="flex flex-col gap-4 p-4">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              Fonctionnalités
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              Comment ça marche
            </a>
            <a
              href="#obs"
              onClick={(e) => {
                e.preventDefault()
                setMobileMenuOpen(false)
                document.getElementById("obs")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              OBS Studio
            </a>
            <Button
              onClick={() => {
                setMobileMenuOpen(false)
                setView("camera")
              }}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Camera className="mr-2 h-4 w-4" />
              Démarrer
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
