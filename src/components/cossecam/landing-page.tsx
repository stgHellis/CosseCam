"use client"

import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { HowItWorksSection } from "./how-it-works-section"
import { ObsSection } from "./obs-section"
import { Footer } from "./footer"

export function LandingPage() {
  return (
    <div className="bg-black">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ObsSection />
      <Footer />
    </div>
  )
}
