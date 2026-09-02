"use client"

import React from "react"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { Icon } from "@boffmedia/ui"
import { PartThumbnailGrid } from "../cat/part-picker"
import { mewArtSrc } from "../mew-art"
import type { MewRec } from "../ui"
import {
  GENETIC_PALETTES,
  PART_CLIPS,
  SLOT_DRAWN_ON_CAT,
  itemFrame,
  type BuilderState,
  type DrawerTarget,
  type EquipSlot,
  type PartSlot,
} from "./builder-state"
import { FALLBACK_SWATCH, PaletteSwatch } from "./BuilderPaletteRail"
import { usePaletteColors } from "./usePaletteColors"
import { PresetGallery } from "./PresetGallery"

export const DRAWER_MIN = 240
export const DRAWER_MAX = 720

/**
 * The picker, as a drawer across the bottom of the builder instead of a 320px
 * rail. Two reasons it is a drawer and not a modal: the cat stays visible, so a
 * pick is seen landing rather than reviewed afterwards, and the stage above
 * simply gets shorter — nothing is covered, so there is no scrim and no focus
 * trap to fight.
 *
 * On a wide screen it is positioned inside the builder rather than `fixed`, so
 * it stops at the tool shell's side rail instead of sliding underneath it.
 * Below `xl` the builder stops being a fixed-height surface and rides the page
 * scroll, so there the drawer does pin to the viewport.
 */
export function BuilderDrawer({
  target,
  state,
  equipItems,
  storyCats,
  selectedPreset,
  height,
  onHeightChange,
  onClose,
  onPartChange,
  onEquip,
  onPaletteChange,
  onLoadPreset,
}: {
  target: DrawerTarget
  state: BuilderState
  equipItems: Record<EquipSlot, MewRec[]>
  storyCats: MewRec[]
  selectedPreset: string | null
  height: number
  onHeightChange: (h: number) => void
  onClose: () => void
  onPartChange: (slot: PartSlot, frame: number) => void
  onEquip: (slot: EquipSlot, frame: number | null) => void
  onPaletteChange: (index: number) => void
  onLoadPreset: (id: string) => void
}) {
  const t = useToolT(MEWGENICS_NS)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const title =
    target.kind === "part"
      ? t(`builder.parts.${target.slot}`)
      : target.kind === "equip"
      ? t(`builder.equip${target.slot.charAt(0).toUpperCase()}${target.slot.slice(1)}`)
      : target.kind === "palette"
      ? t("builder.palette")
      : t("builder.presets")

  const hint =
    target.kind === "equip"
      ? SLOT_DRAWN_ON_CAT[target.slot]
        ? t("builder.equipOnCat")
        : t("builder.equipSideOnly")
      : null

  // Drag the top edge to give the drawer more room. Pointer capture rather than
  // window listeners so a fast drag that leaves the handle keeps resizing.
  const drag = React.useRef<{ y: number; h: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { y: e.clientY, h: height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const next = drag.current.h + (drag.current.y - e.clientY)
    onHeightChange(Math.max(DRAWER_MIN, Math.min(DRAWER_MAX, next)))
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <aside
      style={{ height }}
      aria-label={title}
      className="absolute inset-x-0 bottom-0 z-40 flex flex-col max-xl:fixed border-t-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-2)] [box-shadow:0_-8px_24px_rgba(0,0,0,0.45)] [animation:mew-fade-rise_180ms_ease-out]"
    >
      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="group flex h-3 flex-none cursor-ns-resize items-center justify-center"
      >
        <span className="h-1 w-12 rounded-full bg-[color:var(--mwp-nline)] transition-colors group-hover:bg-[color:var(--mwp-red)]" />
      </div>

      <header className="flex flex-none items-center gap-3 px-3 pb-2">
        <h2 className="m-0 text-[17px]/none tracking-[0.02em] text-[color:var(--mwp-cream)] [font-family:var(--mwf-disp)]">
          {title}
        </h2>
        {hint && (
          <span className="truncate text-[10px] text-[color:var(--mwp-cream-dim)]">{hint}</span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("builder.close")}
          title={t("builder.close")}
          className="ml-auto grid h-8 w-8 flex-none place-items-center border-2 border-solid border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)]"
        >
          <Icon name="x" size={15} />
        </button>
      </header>

      <div className="min-h-0 flex-1 px-3 pb-3">
        {target.kind === "part" && (
          <PartThumbnailGrid
            key={target.slot}
            partKey={target.slot}
            value={state.parts[target.slot] ?? 1}
            onChange={(frame) => onPartChange(target.slot, frame)}
            clipName={PART_CLIPS[target.slot].clipName}
            tileSize={112}
            showTitle={false}
            className="flex h-full min-h-0 flex-col gap-2"
            scrollClassName="flex-1 min-h-0"
          />
        )}

        {target.kind === "equip" && (
          <EquipmentGrid
            slot={target.slot}
            items={equipItems[target.slot]}
            current={state.equipment[target.slot]}
            onEquip={onEquip}
          />
        )}

        {target.kind === "palette" && (
          <PaletteGrid selected={state.palette} onChange={onPaletteChange} />
        )}

        {target.kind === "presets" && (
          <PresetGallery presets={storyCats} selected={selectedPreset} onPick={onLoadPreset} />
        )}
      </div>
    </aside>
  )
}

function EquipmentGrid({
  slot,
  items,
  current,
  onEquip,
}: {
  slot: EquipSlot
  items: MewRec[]
  current: number | undefined
  onEquip: (slot: EquipSlot, frame: number | null) => void
}) {
  const t = useToolT(MEWGENICS_NS)
  const [q, setQ] = React.useState("")

  const shown = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter((i) => String(i.name || i.id).toLowerCase().includes(needle))
  }, [items, q])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-none items-center gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("builder.searchItems")}
          className="min-w-0 flex-1 border-2 border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-2 py-1.5 text-[11px] text-[color:var(--mwp-cream)] [border-radius:var(--wob-sm)] focus:border-[color:var(--mwp-ink)] focus:outline-none"
        />
        <span className="whitespace-nowrap font-mono text-[10px] text-[color:var(--mwp-cream-dim)]">
          {shown.length}/{items.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] p-2 [border-radius:var(--wob-sm)]">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
          <button
            type="button"
            onClick={() => onEquip(slot, null)}
            className={`flex h-[108px] flex-col items-center justify-center gap-1 border-2 border-dashed p-1.5 text-[11px] font-bold transition-all [border-radius:var(--wob-sm)] ${
              current == null
                ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-2)] text-[color:var(--mwp-cream)]"
                : "border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
            }`}
          >
            <Icon name="x" size={16} />
            {t("builder.none")}
          </button>

          {shown.map((item) => {
            const frame = itemFrame(item)
            if (frame == null) return null
            const isOn = current === frame
            const art = mewArtSrc("items", item)
            return (
              <button
                key={String(item.id)}
                type="button"
                title={String(item.name || item.id)}
                onClick={() => onEquip(slot, frame)}
                className={`flex h-[108px] flex-col items-center justify-between gap-1 border-2 border-solid p-1.5 transition-all [border-radius:var(--wob-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] ${
                  isOn
                    ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-night-2)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
                    : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-night-2)]"
                }`}
              >
                {art ? (
                  <img src={art} alt="" loading="lazy" className="h-[62px] w-full object-contain" />
                ) : (
                  <span className="h-[62px]" />
                )}
                <span className="line-clamp-2 text-center text-[10px]/[1.15] text-[color:var(--mwp-cream)]">
                  {String(item.name || item.id)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PaletteGrid({
  selected,
  onChange,
}: {
  selected: number
  onChange: (index: number) => void
}) {
  const t = useToolT(MEWGENICS_NS)
  const colors = usePaletteColors()
  const total = colors.length || GENETIC_PALETTES

  // The first GENETIC_PALETTES rows are what wild cats roll; the rest are
  // story/special colours that only presets and hand-picking reach.
  const groups: Array<{ label: string; from: number; to: number }> = [
    { label: t("builder.paletteStandard"), from: 0, to: Math.min(GENETIC_PALETTES, total) },
  ]
  if (total > GENETIC_PALETTES) {
    groups.push({ label: t("builder.paletteSpecial"), from: GENETIC_PALETTES, to: total })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] p-2.5 [border-radius:var(--wob-sm)]">
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--mwp-cream-dim)]">
              {group.label}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
              {Array.from({ length: group.to - group.from }, (_, i) => i + group.from).map((idx) => (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <PaletteSwatch
                    index={idx}
                    color={colors[idx] || FALLBACK_SWATCH}
                    selected={selected === idx}
                    size={40}
                    onClick={() => onChange(idx)}
                  />
                  <span className="font-mono text-[9px] text-[color:var(--mwp-cream-dim)]">{idx}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
