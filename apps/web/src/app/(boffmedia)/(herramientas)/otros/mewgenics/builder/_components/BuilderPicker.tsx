"use client"

import React, { useEffect, useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { useMewData, MewData } from "@/components/boffmedia/ui/mewgenics"
import { mewPaletteUrl } from "@/components/boffmedia/ui/mewgenics/cat"
import { mewArtSrc } from "@/components/boffmedia/ui/mewgenics/mew-art"
import type { MewRec } from "@/components/boffmedia/ui/mewgenics"

export type EquipSlot = "head" | "face" | "neck" | "weapon" | "trinket"

interface BuilderPickerProps {
  type: "palette" | "presets" | "equipment"
  selected: string | number | null
  onChange: (value: string | number) => void
  /** equipment only: current slot → item frame */
  equipment?: Partial<Record<EquipSlot, number>>
  /** equipment only: pick (or clear, with null) the item for a slot */
  onEquip?: (slot: EquipSlot, frame: number | null) => void
}

export function BuilderPicker({ type, selected, onChange, equipment, onEquip }: BuilderPickerProps) {
  const t = useTranslations("mewgenics")
  const { ready } = useMewData("es")
  const [items, setItems] = useState<MewRec[]>([])
  const [paletteColors, setPaletteColors] = useState<string[]>([])

  useEffect(() => {
    if (!ready) return

    if (type === "presets") {
      const presets = (MewData.data.story_cats as MewRec[]) || []
      setItems(presets.slice(0, 210))
    } else if (type === "equipment") {
      const equip = ((MewData.data.items as MewRec[]) || []).filter((item: MewRec) => {
        const kind = String(item.kind || "").toLowerCase()
        return ["head", "face", "neck", "trinket", "weapon"].includes(kind)
      })
      setItems(equip)
    }
  }, [ready, type])

  // Load palette colors from the palette.png
  useEffect(() => {
    if (type !== "palette") return

    const loadPaletteColors = async () => {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (!ctx) return
          ctx.drawImage(img, 0, 0)

          // Columns 7-12 are fixed highlight/accent slots shared by every
          // palette (column 8 is the same cream in all 49 rows, which is why
          // sampling it made every swatch identical). Columns 2 and 5 carry
          // the palette's own shadow and midtone, so show both as a gradient.
          const at = (x: number, row: number) => {
            const d = ctx.getImageData(Math.min(img.width - 1, x), row, 1, 1).data
            return [d[0], d[1], d[2]] as [number, number, number]
          }
          // Every row with more than one distinct colour is a real palette.
          // catgen's num_palettes (49) is only the range wild cats roll from;
          // story cats reference indices up to 202, so stopping at 49 made
          // most presets unreachable.
          const colors: string[] = []
          for (let row = 0; row < img.height; row++) {
            const shades = new Set<string>()
            for (let x = 0; x < img.width; x++) shades.add(at(x, row).join())
            if (shades.size <= 1) break
            const mid = at(5, row)
            const dark = at(2, row)
            colors.push(
              `linear-gradient(135deg, rgb(${mid.join()}) 0 50%, rgb(${dark.join()}) 50% 100%)`,
            )
          }
          setPaletteColors(colors)
        }
        img.src = mewPaletteUrl()
      } catch (err) {
        console.error("Failed to load palette colors:", err)
      }
    }

    loadPaletteColors()
  }, [type])

  if (type === "palette") {
    // The first GENETIC_PALETTES rows are what wild cats roll; the rest are
    // story/special colours that only presets and hand-picking reach.
    const GENETIC_PALETTES = 49
    const total = paletteColors.length || GENETIC_PALETTES
    const groups: Array<{ label: string; from: number; to: number }> = [
      { label: t("builder.paletteStandard"), from: 0, to: Math.min(GENETIC_PALETTES, total) },
    ]
    if (total > GENETIC_PALETTES) {
      groups.push({ label: t("builder.paletteSpecial"), from: GENETIC_PALETTES, to: total })
    }
    return (
      <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
        <div className="text-[11px] font-bold text-[color:var(--mwp-cream-dim)] uppercase">
          {t("builder.palette")}
        </div>
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase text-[color:var(--mwp-cream-dim)]">
              {g.label}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: g.to - g.from }, (_, i) => i + g.from).map((paletteIdx) => {
                const color =
                  paletteColors[paletteIdx] || "linear-gradient(135deg,#888 0 50%,#666 50% 100%)"
                return (
                  <button
                    key={paletteIdx}
                    type="button"
                    onClick={() => onChange(paletteIdx)}
                    title={String(paletteIdx)}
                    className={`h-8 [border-radius:var(--wob-sm)] border-2 transition-all ${
                      selected === paletteIdx
                        ? "border-[color:var(--mwp-red)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
                        : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)]"
                    }`}
                    style={{ backgroundImage: color }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === "presets") {
    return (
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        <div className="text-[11px] font-bold text-[color:var(--mwp-cream-dim)] uppercase sticky top-0 bg-[color:var(--mwp-night-2)] py-1">
          {t("builder.presets")}
        </div>
        <div className="flex flex-col gap-1">
          {items.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className={`text-left py-2 px-2 text-[12px] [border-radius:var(--wob-sm)] border-2 transition-all ${
                selected === cat.id
                  ? "bg-[color:var(--mwp-red)] text-[color:var(--mwp-paper)] border-[color:var(--mwp-red)]"
                  : "bg-[color:var(--mwp-night-3)] text-[color:var(--mwp-cream)] border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)]"
              }`}
            >
              <div className="font-bold truncate">{cat.name}</div>
              <div className="text-[10px] text-[color:var(--mwp-cream-dim)] truncate">{cat.id}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (type === "equipment") {
    return (
      <EquipmentPicker
        items={items}
        ready={ready}
        equipment={equipment || {}}
        onEquip={onEquip}
      />
    )
  }

  return null
}

const EQUIP_SLOTS: EquipSlot[] = ["head", "face", "neck", "weapon", "trinket"]
// The rig anchors items to the head (ahead/aneck/aface). Weapons and trinkets
// have no anchor anywhere in the cat rig, so they are listed but not drawn.
const SLOT_DRAWN_ON_CAT: Record<EquipSlot, boolean> = {
  head: true, face: true, neck: true, weapon: false, trinket: false,
}

/** Equipment art frame = the trailing number of the item's icon path. */
function itemFrame(item: MewRec): number | null {
  const m = /(\d+)\.svg$/.exec(String(item.icon || ""))
  return m ? parseInt(m[1], 10) : null
}

function EquipmentPicker({
  items,
  ready,
  equipment,
  onEquip,
}: {
  items: MewRec[]
  ready: boolean
  equipment: Partial<Record<EquipSlot, number>>
  onEquip?: (slot: EquipSlot, frame: number | null) => void
}) {
  const t = useTranslations("mewgenics")
  const [slot, setSlot] = useState<EquipSlot>("head")

  const slotItems = React.useMemo(
    () =>
      items
        .filter((i) => String(i.kind || "").toLowerCase() === slot)
        .filter((i) => itemFrame(i) !== null),
    [items, slot],
  )
  const current = equipment[slot]

  if (!ready) {
    return (
      <div className="p-3 text-[11px] text-[color:var(--mwp-cream-dim)]">
        {t("builder.loadingParts")}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {EQUIP_SLOTS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={slot === s}
            onClick={() => setSlot(s)}
            className={`px-2 py-1 text-[11px] font-bold [border-radius:var(--wob-sm)] border-2 border-solid transition-all ${
              slot === s
                ? "bg-[color:var(--mwp-red)] text-[color:var(--mwp-paper)] border-[color:var(--mwp-red)]"
                : "bg-transparent border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
            }`}
          >
            {t(`builder.equip${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-[color:var(--mwp-cream-dim)]">
        {SLOT_DRAWN_ON_CAT[slot] ? t("builder.equipOnCat") : t("builder.equipSideOnly")}
      </div>

      <div className="h-[320px] overflow-y-auto bg-[color:var(--mwp-night-3)] [border-radius:var(--wob-sm)] border-2 border-[color:var(--mwp-nline)] p-2">
        <div className="grid gap-2 [grid-template-columns:repeat(3,minmax(0,1fr))]">
          <button
            type="button"
            onClick={() => onEquip?.(slot, null)}
            className={`flex h-[80px] flex-col items-center justify-center gap-1 [border-radius:var(--wob-sm)] border-2 border-solid p-1 text-[10px] transition-all ${
              current == null
                ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-2)] text-[color:var(--mwp-cream)]"
                : "border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
            }`}
          >
            {t("builder.none")}
          </button>
          {slotItems.map((item) => {
            const frame = itemFrame(item)!
            const selectedItem = current === frame
            return (
              <button
                key={item.id}
                type="button"
                title={item.name || item.id}
                onClick={() => onEquip?.(slot, frame)}
                className={`flex h-[80px] flex-col items-center justify-between gap-0.5 [border-radius:var(--wob-sm)] border-2 border-solid p-1 transition-all ${
                  selectedItem
                    ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-2)]"
                    : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)]"
                }`}
              >
                {item.icon ? (
                  <img
                    src={mewArtSrc("items", item) || ""}
                    alt=""
                    loading="lazy"
                    className="h-[44px] w-full object-contain"
                  />
                ) : (
                  <span className="h-[44px]" />
                )}
                <span className="line-clamp-2 text-[9px]/[1.1] text-[color:var(--mwp-cream-dim)]">
                  {item.name || item.id}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
