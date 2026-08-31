"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { MewCat, loadCatPartsPlacements, loadCatPartsManifest } from "@/components/boffmedia/ui/mewgenics/cat"
import type { CatCompositorProps, CatParts, CatEquipment } from "@/components/boffmedia/ui/mewgenics/cat"
import { BuilderControls } from "./BuilderControls"
import { BuilderPicker, type EquipSlot } from "./BuilderPicker"
import { useMewData, select } from "@/components/boffmedia/ui/mewgenics"

const DEFAULT_CAT: CatParts = {
  body: 1000,
  head: 1000,
  ears: 1005,
  eyes: { left: 1030, right: 1030 },
  eyebrows: 1022,
  mouth: 1023,
  tail: 1007,
  legs: { leg1: 1, leg2: 1 },
  texture: 1031,
  claws: 1,
}

const DEFAULT_PALETTE = 0 // palette.png rows 0-48 are the 49 defined palettes

interface BuilderState {
  parts: CatParts
  palette: number
  pose: { eyes?: "open" | "closed"; mouth?: "normal" | "open" | "smile" }
  equipment: Record<string, number>
}

function serializeState(state: BuilderState): string {
  return btoa(JSON.stringify(state))
}

function deserializeState(encoded: string): BuilderState | null {
  try {
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}

export function MewCatBuilder() {
  const t = useTranslations("mewgenics")
  const locale = useLocale()
  const { ready } = useMewData(locale as "es" | "en")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [state, setState] = useState<BuilderState>({
    parts: DEFAULT_CAT,
    palette: DEFAULT_PALETTE,
    pose: { eyes: "open", mouth: "normal" },
    equipment: {},
  })

  const [tab, setTab] = useState<"parts" | "palette" | "presets" | "equipment">("parts")
  const [showingPart, setShowingPart] = useState<keyof CatParts>("body")
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Load from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = deserializeState(hash)
      if (decoded) setState(decoded)
    }
  }, [])

  // Update URL hash when state changes
  const updateHash = useCallback(
    (newState: BuilderState) => {
      const encoded = serializeState(newState)
      window.location.hash = encoded
    },
    []
  )

  const handlePartChange = useCallback(
    (partKey: keyof CatParts, frame: number) => {
      setState((prev) => {
        const newState = { ...prev, parts: { ...prev.parts, [partKey]: frame } }
        updateHash(newState)
        return newState
      })
      setSelectedPreset(null)
    },
    [updateHash]
  )

  const handlePaletteChange = useCallback(
    (paletteValue: string | number) => {
      const palette = typeof paletteValue === "string" ? parseInt(paletteValue, 10) : paletteValue
      setState((prev) => {
        const newState = { ...prev, palette }
        updateHash(newState)
        return newState
      })
      setSelectedPreset(null)
    },
    [updateHash]
  )

  const handlePoseChange = useCallback(
    (poseType: "eyes" | "mouth", value: string) => {
      setState((prev) => {
        const newState = {
          ...prev,
          pose: {
            ...prev.pose,
            [poseType]: value as "open" | "closed" | "normal" | "smile",
          },
        }
        updateHash(newState)
        return newState
      })
      setSelectedPreset(null)
    },
    [updateHash]
  )

  const handleEquipChange = useCallback(
    (slot: EquipSlot, frame: number | null) => {
      setState((prev) => {
        const equipment = { ...prev.equipment }
        if (frame == null) delete equipment[slot]
        else equipment[slot] = frame
        const newState = { ...prev, equipment }
        updateHash(newState)
        return newState
      })
    },
    [updateHash],
  )

  const handleRandomize = useCallback(() => {
    const newParts: CatParts = {
      body: Math.floor(Math.random() * 250) + 1,
      head: Math.floor(Math.random() * 250) + 1,
      ears: Math.floor(Math.random() * 250) + 1,
      eyes: {
        left: Math.floor(Math.random() * 250) + 1,
        right: Math.floor(Math.random() * 250) + 1,
      },
      eyebrows: Math.floor(Math.random() * 250) + 1,
      mouth: Math.floor(Math.random() * 250) + 1,
      tail: Math.floor(Math.random() * 250) + 1,
      legs: {
        leg1: Math.floor(Math.random() * 250) + 1,
        leg2: Math.floor(Math.random() * 250) + 1,
      },
      texture: Math.floor(Math.random() * 250) + 1,
      claws: Math.floor(Math.random() * 250) + 1,
    }

    const newPalette = Math.floor(Math.random() * 49)

    setState((prev) => {
      const newState = {
        ...prev,
        parts: newParts,
        palette: newPalette,
      }
      updateHash(newState)
      return newState
    })
    setSelectedPreset(null)
  }, [updateHash])

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return
    setIsExporting(true)

    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `mewgenics-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
        setIsExporting(false)
      })
    } catch (err) {
      console.error("Export failed:", err)
      setIsExporting(false)
    }
  }, [])

  const handleLoadPreset = useCallback(
    (presetId: string) => {
      // Look up story cat
      const storyCat = select.get("story_cats", presetId)
      if (!storyCat) return

      const num = (v: unknown): number | undefined =>
        typeof v === "number" && v > 0 ? v : undefined
      const pair = (l: unknown, r: unknown): number | { left: number; right: number } | undefined => {
        const left = num(l)
        const right = num(r)
        if (left === undefined && right === undefined) return undefined
        return { left: left ?? right ?? 1, right: right ?? left ?? 1 }
      }
      const newParts: CatParts = {
        body: num(storyCat.body) ?? DEFAULT_CAT.body,
        head: num(storyCat.head) ?? DEFAULT_CAT.head,
        ears: pair(storyCat.leftear, storyCat.rightear) ?? DEFAULT_CAT.ears,
        eyes: pair(storyCat.lefteye, storyCat.righteye) ?? DEFAULT_CAT.eyes,
        eyebrows: pair(storyCat.lefteyebrow, storyCat.righteyebrow) ?? DEFAULT_CAT.eyebrows,
        mouth: num(storyCat.mouth) ?? DEFAULT_CAT.mouth,
        tail: num(storyCat.tail) ?? DEFAULT_CAT.tail,
        legs: {
          leg1: num(storyCat.leg1) ?? 1,
          leg2: num(storyCat.leg2) ?? num(storyCat.leg1) ?? 1,
        },
        arms: {
          arm1: num(storyCat.arm1) ?? num(storyCat.leg1) ?? 1,
          arm2: num(storyCat.arm2) ?? num(storyCat.arm1) ?? num(storyCat.leg1) ?? 1,
        },
        texture: num(storyCat.texture) ?? DEFAULT_CAT.texture,
        claws: num(storyCat.claws) ?? DEFAULT_CAT.claws,
      }

      const newPalette =
        typeof storyCat.palette === "number" ? storyCat.palette : DEFAULT_PALETTE

      setState((prev) => {
        const newState = {
          ...prev,
          parts: newParts,
          palette: newPalette,
        }
        updateHash(newState)
        return newState
      })
      setSelectedPreset(presetId)
    },
    [updateHash]
  )

  return (
    <div className="mew-skin flex flex-col gap-4 p-4 min-h-screen bg-[color:var(--mwp-night)] text-[color:var(--mwp-cream)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] p-3 [border-radius:var(--wob-sm)] border-2 border-solid border-[color:var(--mwp-ink)] [box-shadow:0_4px_0_var(--mwp-shadow-md)]">
        <div className="flex items-center gap-2">
          <span className="text-[20px] [font-family:var(--mwf-disp)]">
            {t("builder.title")}
          </span>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleRandomize}
            className="inline-flex items-center gap-1 px-3 py-2 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_var(--mwp-shadow-sm)] hover:translate-y-[-1px] active:translate-y-0.5 text-[12px] font-bold [font-family:var(--mwf-disp)]"
            disabled={!ready}
          >
            <Icon name="sparkles" size={14} />
            {t("builder.randomize")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !ready}
            className="inline-flex items-center gap-1 px-3 py-2 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_var(--mwp-shadow-sm)] hover:translate-y-[-1px] active:translate-y-0.5 text-[12px] font-bold [font-family:var(--mwf-disp)] disabled:opacity-50"
          >
            <Icon name="download" size={14} />
            {isExporting ? t("builder.exporting") : t("builder.export")}
          </button>
        </div>
      </div>

      <div className="flex gap-4 min-h-0 flex-1">
        {/* Main Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[color:var(--mwp-night-2)] [border-radius:var(--wob-sm)] p-4 border-2 border-dashed border-[color:var(--mwp-nline)]">
          <MewCat
            ref={canvasRef}
            parts={state.parts}
            palette={state.palette}
            pose={state.pose}
            equipment={state.equipment}
            size={400}
          />
        </div>

        {/* Controls Panel */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-1 bg-[color:var(--mwp-night-2)] p-2 [border-radius:var(--wob-sm)] border-2 border-solid border-[color:var(--mwp-nline)]">
            {(["parts", "palette", "presets", "equipment"] as const).map((t_key) => (
              <button
                key={t_key}
                type="button"
                onClick={() => setTab(t_key)}
                className={`flex-1 py-2 text-[12px] font-bold [font-family:var(--mwf-disp)] [border-radius:var(--wob-sm)] transition-all ${
                  tab === t_key
                    ? "bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] border-2 border-solid border-[color:var(--mwp-ink)]"
                    : "text-[color:var(--mwp-cream-dim)] hover:text-[color:var(--mwp-cream)]"
                }`}
              >
                {t(`builder.tab.${t_key}`)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === "parts" && <BuilderControls state={state} onChange={handlePartChange} onPoseChange={handlePoseChange} />}
          {tab === "palette" && <BuilderPicker type="palette" selected={state.palette} onChange={handlePaletteChange} />}
          {tab === "presets" && (
            <BuilderPicker
              type="presets"
              selected={selectedPreset}
              onChange={(id) => handleLoadPreset(String(id))}
            />
          )}
          {tab === "equipment" && (
            <BuilderPicker
              type="equipment"
              selected=""
              onChange={() => {}}
              equipment={state.equipment as Partial<Record<EquipSlot, number>>}
              onEquip={handleEquipChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
