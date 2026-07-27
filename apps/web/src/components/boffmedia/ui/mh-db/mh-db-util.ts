import type { IconName } from "@/components/boffmedia/primitives"

// v3 «Señal» — MH Wilds Armería / armor-DB shared types + static maps + helpers.
// Mirrors the presentational bits of v3-mh-db-kit.jsx. The real MHDB data layer
// isn't wired to the design system — components are prop-driven and fed mock data
// (see _chapters/mh-db-demo.ts). [deferred]

export type SkillCategory = "attack" | "element" | "defense" | "utility"

// skill category → chip tint (mirrors .sk-* in mh-db.css)
export const MH_SKILL_CAT: Record<SkillCategory, string> = {
  attack: "#ff7a5c",
  element: "#5fc9e8",
  defense: "#6f9bff",
  utility: "#7fd6a8",
}

// sharpness palette (red → purple), used by MhWeaponCard + MhSharpHandicraft.
export const MH_SHARPNESS: { key: string; color: string }[] = [
  { key: "red", color: "#d64541" },
  { key: "orange", color: "#e08a3c" },
  { key: "yellow", color: "#e0c93c" },
  { key: "green", color: "#5bbd5b" },
  { key: "blue", color: "#4f89e8" },
  { key: "white", color: "#e6ebf2" },
  { key: "purple", color: "#b06bff" },
]

// hunting-horn note palette (mirrors HuntingHornNote enum)
export const MH_NOTE_COLORS: Record<string, string> = {
  purple: "#b06bff", red: "#d64541", orange: "#e08a3c", yellow: "#e0c93c",
  green: "#5bbd5b", blue: "#4f89e8", aqua: "#5fe3f0", white: "#e6ebf2",
}

// bow coatings + charge-blade phials
export const MH_COATINGS: Record<string, { label: string; color: string }> = {
  "close-range": { label: "Cerca", color: "#cfd6e0" },
  power: { label: "Potencia", color: "#ff7a5c" },
  pierce: { label: "Perforante", color: "#9aa3b2" },
  paralysis: { label: "Parálisis", color: "#ffd34d" },
  poison: { label: "Veneno", color: "#a855f7" },
  sleep: { label: "Sueño", color: "#6f8bff" },
  blast: { label: "Explosión", color: "#ff8a3d" },
  exhaust: { label: "Agotamiento", color: "#5fe3f0" },
}
// labels are chrome, resolved via t(`mhwilds.db.vial.${key}`) by the consuming
// component — never call t() at module scope.
export const MH_PHIALS: Record<string, { labelKey: string; icon: IconName }> = {
  impact: { labelKey: "impact", icon: "hammer" },
  element: { labelKey: "element", icon: "flame" },
  power: { labelKey: "power", icon: "bolt" },
  dragon: { labelKey: "dragon", icon: "flame" },
}

// resistance elements (colour + label) for armor set cards
export const MH_ELEMENTS: Record<string, { color: string; label: string; short: string }> = {
  fire: { color: "#ff7a5c", label: "Fuego", short: "FUE" },
  water: { color: "#4f89e8", label: "Agua", short: "AGU" },
  thunder: { color: "#e0c93c", label: "Rayo", short: "RAY" },
  ice: { color: "#5fe3f0", label: "Hielo", short: "HIE" },
  dragon: { color: "#b06bff", label: "Dragón", short: "DRA" },
}
export const MH_RES_ORDER = ["fire", "water", "thunder", "ice", "dragon"]

// values are chrome keys, resolved via t(`mhwilds.db.elderseal.${key}`) by the
// consuming component — never call t() at module scope.
export const MH_ELDERSEAL: Record<string, string> = { low: "low", average: "average", high: "high" }

// ── types ────────────────────────────────────────────────────────────────────
export interface MhSkill {
  id: number
  name: string
  category: SkillCategory
  description: string
}
export interface MhBonusRank {
  pieces: number
  skillName: string
  level: number
  desc?: string
}
export interface MhSetBonusData {
  name: string
  ranks: MhBonusRank[]
}
export interface MhArmorPiece {
  id: number
  kind: string
  kindLabel: string
  name: string
  skills: { skill: MhSkill; level: number }[]
  slots: number[]
  defense: number
}
export interface MhArmorProfile {
  pieces: number
  defense: { base: number; max: number }
  resistances: Record<string, number>
  skills: { skill: MhSkill; level: number }[]
}
export interface MhArmorSet {
  id: number
  name: string
  series: string
  rarity: number
  hue: number
  bonus?: MhSetBonusData
  group?: MhSetBonusData
  profile: MhArmorProfile
}
export interface MhWeaponSpecial {
  color: string
  value: number
  short: string
}
export interface MhWeaponExtraData {
  coatings?: string[]
  phial?: string
  melody?: string[]
  songs?: { name: string; sequence: string[] }[]
}
export interface MhWeapon {
  id: number
  type: string
  typeLabel: string
  typeIcon: IconName
  name: string
  rarity: number
  attack: number
  affinity: number
  special?: MhWeaponSpecial
  /** base sharpness segments in MH_SHARPNESS order. */
  sharpness?: number[]
  /** sharpness segments at max Handicraft. */
  sharpnessMax?: number[]
  handicraftLevels?: number
  extra?: MhWeaponExtraData
  elderseal?: string
}

// ── helpers ──────────────────────────────────────────────────────────────────
/** Interpolate the sharpness segments between base and max by Handicraft level. */
export function sharpnessAt(weapon: MhWeapon, lv: number): number[] {
  const base = weapon.sharpness || []
  const max = weapon.sharpnessMax || base
  const levels = weapon.handicraftLevels || 5
  const t = levels ? Math.max(0, Math.min(1, lv / levels)) : 0
  return base.map((b, i) => Math.round(b + ((max[i] ?? b) - b) * t))
}

/** The highest non-empty sharpness colour in the array. */
export function topSharpColor(arr: number[]): { color: string } | null {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i] > 0) return MH_SHARPNESS[i]
  return null
}
