"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useMarks, useMons } from "../_hooks/queries"
import { isLegendary, isShiny } from "../_utils/derive"
import { markOf } from "../_utils/marks"
import { Bar, Icon, type IconName } from "./ui"

interface Tile {
  icon: IconName
  label: string
  value: number
  /** Literal class — an interpolated `text-pc-${tone}` would never compile. */
  tone: string
}

export interface CollectionProgressProps {
  onOpenLivingDex: () => void
}

/**
 * The side panel's crown. Every number here is counted off the real collection —
 * the dex denominator is the species list the Pokédex already fetched, not a
 * hardcoded 1025, so it stays right when the game server's roster changes.
 */
export function CollectionProgress({ onOpenLivingDex }: CollectionProgressProps) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const { data: marks } = useMarks()
  const dexTotal = usePokemonStore((s) => s.allPokemon.length)

  const stats = useMemo(() => {
    const species = new Set<number>()
    let shiny = 0
    let legend = 0
    let fav = 0
    for (const m of mons) {
      species.add(m.pokemon.dex)
      if (isShiny(m.pokemon)) shiny += 1
      if (isLegendary(m.pokemon)) legend += 1
      if (marks && markOf(marks, m.key).favorite) fav += 1
    }
    return { total: mons.length, species: species.size, shiny, legend, fav }
  }, [mons, marks])

  const dexPct = dexTotal > 0 ? Math.round((stats.species / dexTotal) * 100) : 0

  const tiles: Tile[] = [
    { icon: "package", label: t("livingDex.title"), value: stats.total, tone: "text-pc-accent" },
    { icon: "sparkles", label: t("filters.statusToggles.shiny"), value: stats.shiny, tone: "text-pc-gold" },
    { icon: "zap", label: t("filters.statusToggles.legendary"), value: stats.legend, tone: "text-pc-violet" },
    { icon: "heart", label: t("filters.statusToggles.favorite"), value: stats.fav, tone: "text-pc-rose" },
  ]

  return (
    <div className="flex-none border-b border-pc-line p-3">
      <button
        type="button"
        onClick={onOpenLivingDex}
        title={t("topbar.livingDex")}
        className="mb-2 flex w-full items-center justify-between rounded-md text-left focus-visible:outline-none"
      >
        <span className="flex items-center gap-1.5 font-pc text-[0.71875rem] font-semibold text-pc-fg-muted">
          <Icon name="book" size={13} className="text-pc-gold" />
          {t("livingDex.title")}
        </span>
        <span className="flex items-center gap-1 font-pc-mono text-xs font-extrabold text-pc-accent">
          {dexPct}%
          <Icon name="arrowR" size={12} className="text-pc-fg-subtle" />
        </span>
      </button>

      <Bar
        pct={dexPct}
        tone="linear-gradient(90deg, rgb(var(--pc-accent)), rgb(var(--pc-cyan)))"
        height={7}
        className="mb-[0.6875rem]"
      />

      <div className="grid grid-cols-4 gap-1.5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-[9px] border border-pc-line bg-white/[.03] px-0.5 py-[0.4375rem] text-center"
          >
            <Icon name={t.icon} size={13} className={`mx-auto ${t.tone}`} />
            <div className="mt-0.5 font-pc-mono text-sm font-extrabold text-pc-fg">{t.value}</div>
            <div className="text-[0.59375rem] uppercase tracking-[.04em] text-pc-fg-subtle">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
