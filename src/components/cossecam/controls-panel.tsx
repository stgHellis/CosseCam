"use client"

import {
  SlidersHorizontal,
  Sun,
  CircleDot,
  Palette,
  Maximize,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Aperture,
  Diamond,
  RotateCcw,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCosseCamStore } from "@/store/cossecam-store"

export function ControlsPanel() {
  const {
    controlsPanelOpen,
    setControlsPanelOpen,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturation,
    setSaturation,
    zoom,
    setZoom,
    rotation,
    setRotation,
    flipH,
    toggleFlipH,
    flipV,
    toggleFlipV,
    exposure,
    setExposure,
    sharpness,
    setSharpness,
    resetControls,
  } = useCosseCamStore()

  const controls = [
    {
      icon: Sun,
      label: "Luminosité",
      value: brightness,
      onChange: setBrightness,
      min: 50,
      max: 200,
      step: 1,
      unit: "%",
    },
    {
      icon: CircleDot,
      label: "Contraste",
      value: contrast,
      onChange: setContrast,
      min: 50,
      max: 200,
      step: 1,
      unit: "%",
    },
    {
      icon: Palette,
      label: "Saturation",
      value: saturation,
      onChange: setSaturation,
      min: 0,
      max: 200,
      step: 1,
      unit: "%",
    },
    {
      icon: Maximize,
      label: "Zoom",
      value: zoom,
      onChange: setZoom,
      min: 1,
      max: 5,
      step: 0.1,
      unit: "x",
    },
    {
      icon: Aperture,
      label: "Exposition",
      value: exposure,
      onChange: setExposure,
      min: -100,
      max: 100,
      step: 1,
      unit: "",
    },
    {
      icon: Diamond,
      label: "Netteté",
      value: sharpness,
      onChange: setSharpness,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
    },
  ]

  const isModified =
    brightness !== 100 ||
    contrast !== 100 ||
    saturation !== 100 ||
    zoom !== 1 ||
    rotation !== 0 ||
    flipH ||
    flipV ||
    exposure !== 0 ||
    sharpness !== 0

  return (
    <Sheet open={controlsPanelOpen} onOpenChange={setControlsPanelOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t border-white/10 bg-gray-950"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            Ajustements vidéo
          </SheetTitle>
          <SheetDescription className="text-gray-500">
            Modifiez les paramètres de votre flux en temps réel.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[50vh] pr-2">
          <div className="flex flex-col gap-5 pb-4 pt-2">
            {controls.map((ctrl) => {
              const Icon = ctrl.icon
              return (
                <div key={ctrl.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm text-gray-300">
                      <Icon className="h-3.5 w-3.5 text-gray-500" />
                      {ctrl.label}
                    </Label>
                    <span className="font-mono text-xs text-emerald-400">
                      {typeof ctrl.value === "number" && ctrl.step < 1
                        ? ctrl.value.toFixed(1)
                        : ctrl.value}
                      {ctrl.unit}
                    </span>
                  </div>
                  <Slider
                    value={[ctrl.value]}
                    min={ctrl.min}
                    max={ctrl.max}
                    step={ctrl.step}
                    onValueChange={(v) => ctrl.onChange(v[0])}
                    className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
                  />
                </div>
              )
            })}

            <Separator className="bg-white/[0.06]" />

            {/* Rotation & Flip row */}
            <div className="space-y-3">
              <Label className="text-sm text-gray-300">Rotation & Miroir</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Rotation</span>
                  <div className="flex items-center gap-1.5">
                    <Slider
                      value={[rotation]}
                      min={0}
                      max={360}
                      step={15}
                      onValueChange={(v) => setRotation(v[0])}
                      className="flex-1 [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-xs text-emerald-400">
                      {rotation}°
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={flipH ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFlipH}
                  className={
                    flipH
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                      : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                  }
                >
                  <FlipHorizontal className="mr-1.5 h-4 w-4" />
                  Miroir H
                </Button>
                <Button
                  variant={flipV ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFlipV}
                  className={
                    flipV
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                      : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                  }
                >
                  <FlipVertical className="mr-1.5 h-4 w-4" />
                  Miroir V
                </Button>
                {isModified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetControls}
                    className="ml-auto text-gray-500 hover:text-red-400"
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
