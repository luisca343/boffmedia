"use client"

import React from "react"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { GENETIC_PALETTES } from "./builder-state"
import { usePaletteColors } from "./usePaletteColors"

export const FALLBACK_SWATCH = "linear-gradient(135deg,#888 0 50%,#666 50% 100%)"

/**
 * Colour lives beside the cat, not behind a tab: it is the change you try most
 * often and the one whose result you most want to watch land.
 *
 * The rail carries the 49 palettes a wild cat can actually roll; the ~150 story
 * and special rows past that are one click away in the drawer, where they have
 * room to be laid out and labelled.
 */
export function BuilderPaletteRail({
  selected,
  onChange,
  onOpenAll,
}: {
  selected: number
  onChange: (index: number) => void
  onOpenAll: () => void
}) {
  const t = useToolT(MEWGENICS_NS)
  const colors = usePaletteColors()
  const total = colors.length || GENETIC_PALETTES
  const shown = Math.min(GENETIC_PALETTES, total)

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2 border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-2)] p-2.5 [border-radius:var(--wob-sm)]">
      <h2 className="m-0 flex items-baseline gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-[color:var(--mwp-cream-dim)]">
        {t("builder.palette")}
        <span className="font-mono text-[0.625rem] opacity-70">#{selected}</span>
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto max-xl:max-h-[5.75rem]">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(1.875rem,1fr))] gap-1.5">
          {Array.from({ length: shown }, (_, i) => (
            <PaletteSwatch
              key={i}
              index={i}
              color={colors[i] || FALLBACK_SWATCH}
              selected={selected === i}
              onClick={() => onChange(i)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenAll}
        className="flex-none border-2 border-dashed border-[color:var(--mwp-nline)] px-1.5 py-1.5 text-[0.625rem] font-bold uppercase leading-[1.15] tracking-[0.04em] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)]"
      >
        {t("builder.paletteAll", { n: total })}
      </button>
    </section>
  )
}

export function PaletteSwatch({
  index,
  color,
  selected,
  size = 30,
  onClick,
}: {
  index: number
  color: string
  selected: boolean
  size?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`#${index}`}
      aria-label={`#${index}`}
      aria-pressed={selected}
      style={{ backgroundImage: color, height: size }}
      className={`w-full border-2 border-solid [border-radius:var(--wob-sm)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] ${
        selected
          ? "border-[color:var(--mwp-red)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
          : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)]"
      }`}
    />
  )
}
