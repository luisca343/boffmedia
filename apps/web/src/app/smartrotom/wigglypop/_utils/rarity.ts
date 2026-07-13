import type { WpRarity } from "../_types/market.types"

/**
 * Rarity is data-driven — a Pokémon's IVs and legendary flag pick one of four
 * tiers — so every rarity-dependent class here is a **literal string in a map**.
 * Building them (`text-wp-rarity-${rarity}`) would silently never compile:
 * Tailwind's JIT only sees literal strings, and the style would just vanish with
 * no error (SMARTROTOM_V3.md §4, audit gap G2).
 */

export const RARITY_LABEL: Record<WpRarity, string> = {
  comun: "Común",
  raro: "Raro",
  epico: "Épico",
  legendario: "Legendario",
}

export const RARITY_TEXT: Record<WpRarity, string> = {
  comun: "text-wp-rarity-comun",
  raro: "text-wp-rarity-raro",
  epico: "text-wp-rarity-epico",
  legendario: "text-wp-rarity-legendario",
}

/** The 4px strip across the top edge of a card. Común is solid; the three tiers
 *  above it fade in from both edges, and legendary alone also glows. */
export const RARITY_STRIP: Record<WpRarity, string> = {
  comun: "bg-wp-rarity-comun",
  raro: "bg-gradient-to-r from-transparent via-wp-rarity-raro to-transparent",
  epico: "bg-gradient-to-r from-transparent via-wp-rarity-epico to-transparent",
  legendario:
    "bg-gradient-to-r from-transparent via-wp-rarity-legendario to-transparent shadow-[0_0_12px_rgb(var(--wp-rarity-legendario))]",
}

/** Card hover: the border and the drop shadow both take the rarity's hue. */
export const RARITY_HOVER: Record<WpRarity, string> = {
  comun: "hover:border-wp-accent hover:shadow-wp-card-hover",
  raro: "hover:border-wp-rarity-raro hover:shadow-wp-raro",
  epico: "hover:border-wp-rarity-epico hover:shadow-wp-epico",
  legendario: "hover:border-wp-rarity-legendario hover:shadow-wp-legendario",
}

/**
 * The valuation model's rarity cut-offs. Mirrors the server's
 * `WigglypopValuationService` exactly — if you change one, change both, or a
 * listing will paint a different tier than the price it was valued at.
 */
export function rarityOf(opts: { legendary: boolean; ivPct: number }): WpRarity {
  if (opts.legendary) return "legendario"
  if (opts.ivPct >= 92) return "epico"
  if (opts.ivPct >= 74) return "raro"
  return "comun"
}

/** The six IVs sum out of a perfect 186. */
export function ivPct(ivs: number[]): number {
  const total = ivs.reduce((a, b) => a + b, 0)
  return Math.round((total / 186) * 100)
}

export function ivTotal(ivs: number[]): number {
  return ivs.reduce((a, b) => a + b, 0)
}
