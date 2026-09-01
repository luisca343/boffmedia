import type * as React from "react"

// Damage tones → colors — red/amber/dim map to status tokens.
export type DamageTone = "red" | "orange" | "amber" | "dim"

export const DAMAGE_TONE_COLORS: Record<DamageTone, string> = {
  red: "var(--bad)",
  orange: "#ff7a33",
  amber: "var(--warn)",
  dim: "var(--dim)",
}

export function damageColor(t: DamageTone): string {
  return DAMAGE_TONE_COLORS[t] ?? DAMAGE_TONE_COLORS.dim
}

// maxPct → tone. Mirrors smogonAdapter.getDamageColorClass thresholds.
export function damageTone(maxPct: number): DamageTone {
  if (maxPct >= 100) return "red"
  if (maxPct >= 75) return "orange"
  if (maxPct >= 50) return "amber"
  return "dim"
}

// Role accents: attacker = brand orange, defender = signal (info).
export const ATK_COLOR = "var(--accent)"
export const DEF_COLOR = "var(--info)"

// Pokémon type colours live in the datakit — one palette for every Pokémon tool
// in the product. This file used to carry an English-only copy of the same
// eighteen hexes, and `meta-types.ts` a third.
export { TYPE_COLORS, TYPE_NAMES_EN, typeColor } from "@boffmedia/ui/datakit"

// Inline CSS custom properties (e.g. --cxc) alongside standard style props.
// @types/react in this repo rejects `--x` keys on object literals, so route
// them through one localized cast.
export function cssVars(vars: Record<string, string | number | undefined>): React.CSSProperties {
  return vars as unknown as React.CSSProperties
}
