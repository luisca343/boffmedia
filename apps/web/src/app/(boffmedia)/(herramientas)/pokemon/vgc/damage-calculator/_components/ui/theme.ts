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

// Canonical Pokémon type colors, English-keyed (calc data is English).
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#9fa19f", Fire: "#e62829", Water: "#2980ef", Electric: "#fac000",
  Grass: "#3fa129", Ice: "#3dcef3", Fighting: "#ff8000", Poison: "#9141cb",
  Ground: "#915121", Flying: "#81b9ef", Psychic: "#ef4179", Bug: "#91a119",
  Rock: "#afa981", Ghost: "#704170", Dragon: "#5060e1", Dark: "#624d4e",
  Steel: "#60a1b8", Fairy: "#ef70ef",
}

export function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "var(--dim)"
}

// Inline CSS custom properties (e.g. --cxc) alongside standard style props.
// @types/react in this repo rejects `--x` keys on object literals, so route
// them through one localized cast.
export function cssVars(vars: Record<string, string | number | undefined>): React.CSSProperties {
  return vars as unknown as React.CSSProperties
}
