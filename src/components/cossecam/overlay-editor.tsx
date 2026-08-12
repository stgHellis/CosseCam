"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Type,
  ImageIcon,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCosseCamStore, type OverlayConfig } from "@/store/cossecam-store"

const generateId = () => Math.random().toString(36).substring(2, 11)

const makeTextOverlay = (): OverlayConfig => ({
  id: generateId(),
  type: "text",
  content: "Mon texte",
  positionX: 50,
  positionY: 80,
  width: 30,
  height: 10,
  fontSize: 24,
  fontColor: "#ffffff",
  bgColor: "#000000",
  bgOpacity: 0,
  isVisible: true,
})

const makeImageOverlay = (): OverlayConfig => ({
  id: generateId(),
  type: "image",
  content: "Image",
  imageUrl: "",
  positionX: 50,
  positionY: 50,
  width: 20,
  height: 20,
  fontSize: 14,
  fontColor: "#ffffff",
  bgColor: "#000000",
  bgOpacity: 0,
  isVisible: true,
})

const makeLowerThird = (): OverlayConfig => ({
  id: generateId(),
  type: "lower-third",
  content: "Titre principal",
  secondaryText: "Sous-titre informatif",
  positionX: 5,
  positionY: 85,
  width: 40,
  height: 10,
  fontSize: 20,
  fontColor: "#ffffff",
  bgColor: "#10b981",
  bgOpacity: 0.85,
  isVisible: true,
})

function OverlayItem({
  overlay,
  isExpanded,
  onToggleExpand,
}: {
  overlay: OverlayConfig
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const { updateOverlay, removeOverlay, toggleOverlayVisibility } =
    useCosseCamStore()

  const typeIcon = () => {
    switch (overlay.type) {
      case "text":
        return <Type className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "lower-third":
        return <Layers className="h-4 w-4" />
    }
  }

  const typeLabel = () => {
    switch (overlay.type) {
      case "text":
        return "Texte"
      case "image":
        return "Image"
      case "lower-third":
        return "Bandeau"
    }
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => toggleOverlayVisibility(overlay.id)}
          className={`shrink-0 transition-colors ${
            overlay.isVisible
              ? "text-emerald-400"
              : "text-gray-600 hover:text-gray-400"
          }`}
          title={overlay.isVisible ? "Masquer" : "Afficher"}
        >
          {overlay.isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {typeIcon()}
          <span className="truncate text-sm text-gray-300">
            {overlay.content || typeLabel()}
          </span>
          {isExpanded ? (
            <ChevronUp className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-500" />
          ) : (
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-500" />
          )}
        </button>

        <button
          onClick={() => removeOverlay(overlay.id)}
          className="shrink-0 text-gray-600 transition-colors hover:text-red-400"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 border-t border-white/[0.06] p-3">
          {overlay.type !== "image" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Contenu</Label>
              <Input
                value={overlay.content}
                onChange={(e) =>
                  updateOverlay(overlay.id, { content: e.target.value })
                }
                className="border-white/10 bg-black/50 text-sm text-white"
              />
            </div>
          )}

          {overlay.type === "lower-third" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Sous-titre</Label>
              <Input
                value={overlay.secondaryText || ""}
                onChange={(e) =>
                  updateOverlay(overlay.id, {
                    secondaryText: e.target.value,
                  })
                }
                className="border-white/10 bg-black/50 text-sm text-white"
              />
            </div>
          )}

          {overlay.type === "image" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">URL de l&apos;image</Label>
              <Input
                value={overlay.imageUrl || ""}
                placeholder="https://..."
                onChange={(e) =>
                  updateOverlay(overlay.id, { imageUrl: e.target.value })
                }
                className="border-white/10 bg-black/50 text-sm text-white"
              />
            </div>
          )}

          {overlay.type !== "image" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Taille du texte</Label>
                <span className="font-mono text-xs text-emerald-400">
                  {overlay.fontSize}px
                </span>
              </div>
              <Slider
                value={[overlay.fontSize]}
                min={10}
                max={72}
                step={1}
                onValueChange={(v) =>
                  updateOverlay(overlay.id, { fontSize: v[0] })
                }
                className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
              />
            </div>
          )}

          {overlay.type !== "lower-third" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Position X</Label>
                <span className="font-mono text-xs text-emerald-400">
                  {overlay.positionX}%
                </span>
              </div>
              <Slider
                value={[overlay.positionX]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) =>
                  updateOverlay(overlay.id, { positionX: v[0] })
                }
                className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
              />
            </div>
          )}

          {overlay.type !== "lower-third" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Position Y</Label>
                <span className="font-mono text-xs text-emerald-400">
                  {overlay.positionY}%
                </span>
              </div>
              <Slider
                value={[overlay.positionY]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) =>
                  updateOverlay(overlay.id, { positionY: v[0] })
                }
                className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
              />
            </div>
          )}

          {overlay.type !== "image" && (
            <div className="flex items-center gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Couleur du texte</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={overlay.fontColor}
                    onChange={(e) =>
                      updateOverlay(overlay.id, { fontColor: e.target.value })
                    }
                    className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs text-gray-500">
                    {overlay.fontColor}
                  </span>
                </div>
              </div>

              {overlay.type === "lower-third" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Couleur de fond</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={overlay.bgColor}
                      onChange={(e) =>
                        updateOverlay(overlay.id, { bgColor: e.target.value })
                      }
                      className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="font-mono text-xs text-gray-500">
                      {overlay.bgColor}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function OverlayEditor() {
  const { overlayEditorOpen, setOverlayEditorOpen, overlays, addOverlay } =
    useCosseCamStore()

  return (
    <Sheet open={overlayEditorOpen} onOpenChange={setOverlayEditorOpen}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-t border-white/10 bg-gray-950"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Layers className="h-4 w-4 text-emerald-400" />
            Surpositions
          </SheetTitle>
          <SheetDescription className="text-gray-500">
            Ajoutez du texte, des images et des bandes d&eacute;filantes sur votre
            flux.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[45vh] pr-2">
          <div className="flex flex-col gap-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addOverlay(makeTextOverlay())}
                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Type className="mr-1.5 h-3.5 w-3.5" />
                Texte
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addOverlay(makeImageOverlay())}
                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Image
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addOverlay(makeLowerThird())}
                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Layers className="mr-1.5 h-3.5 w-3.5" />
                Bandeau
              </Button>
            </div>

            <Separator className="bg-white/[0.06]" />

            {overlays.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Layers className="h-8 w-8 text-gray-700" />
                <p className="text-sm text-gray-600">
                  Aucune surposition. Ajoutez-en une ci-dessus.
                </p>
              </div>
            ) : (
              <OverlayList />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function OverlayList() {
  const { overlays } = useCosseCamStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      {overlays.map((overlay) => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          isExpanded={expandedId === overlay.id}
          onToggleExpand={() =>
            setExpandedId(expandedId === overlay.id ? null : overlay.id)
          }
        />
      ))}
    </div>
  )
}
