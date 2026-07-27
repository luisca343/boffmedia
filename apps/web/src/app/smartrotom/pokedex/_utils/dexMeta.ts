/**
 * Numeric-to-colour ramps and status/rarity metadata for the Pokédex. Colours
 * are data-driven (applied via inline `style`); labels are next-intl keys the
 * consuming component resolves with `t(...)` — never a literal.
 */

// Per-stat colour ramp for stat bars (0–255 scale).
export function statColor(value: number): string {
  if (value >= 150) return "#a855f7"
  if (value >= 110) return "#22d3ee"
  if (value >= 80) return "#a3e635"
  if (value >= 50) return "#fbbf24"
  return "#f87171"
}

// Base-stat-total colour ramp.
export function totalStatColor(total: number): string {
  if (total >= 620) return "#a855f7"
  if (total >= 540) return "#22d3ee"
  if (total >= 460) return "#a3e635"
  if (total >= 380) return "#fbbf24"
  return "#f87171"
}

// Pick black/white ink for legibility over an arbitrary hex background.
export function getContrastingTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff"
}

export type DexStatus = "caught" | "seen" | "shiny" | "unknown"

export const STATUS_META: Record<DexStatus, { fg: string; bg: string; labelKey: string }> = {
  caught: { fg: "#34d399", bg: "rgba(52,211,153,.15)", labelKey: "dexStatus.caught" },
  seen: { fg: "#fbbf24", bg: "rgba(251,191,36,.15)", labelKey: "dexStatus.seen" },
  shiny: { fg: "#f0abfc", bg: "rgba(240,171,252,.15)", labelKey: "dexStatus.shiny" },
  unknown: { fg: "#97a6bb", bg: "rgba(151,166,187,.12)", labelKey: "dexStatus.unknown" },
}

export const RARITY_META: Record<string, { fg: string; bg: string; labelKey: string; weight: number }> = {
  common: { fg: "#a3e635", bg: "rgba(163,230,53,.12)", labelKey: "rarity.common", weight: 1 },
  uncommon: { fg: "#22d3ee", bg: "rgba(34,211,238,.12)", labelKey: "rarity.uncommon", weight: 2 },
  rare: { fg: "#fb923c", bg: "rgba(251,146,60,.14)", labelKey: "rarity.rare", weight: 3 },
  ultra: { fg: "#c084fc", bg: "rgba(192,132,252,.14)", labelKey: "rarity.ultra", weight: 4 },
  legendary: { fg: "#f0abfc", bg: "rgba(240,171,252,.14)", labelKey: "rarity.legendary", weight: 5 },
}
