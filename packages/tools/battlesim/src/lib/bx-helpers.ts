// Battle-HUD helpers for the v3 `Bx*` kit: type colours, HP tone, type
// effectiveness and projected speed order. Consumes the real engine's BSX
// shapes (English type keys).
//
// Every user-facing WORD used to live here as a Spanish map (CAT_ES,
// STATUS_ES, BOOST_ES…), which meant an English UI still printed Spanish
// chips. Those labels are catalog keys now — `useBxLabels()` in bx-kit resolves
// them — and this module keeps only data: colours, ids, numbers.
import type { BSXMon, BSXKeyMove, BSXTickEv, TeamMemberHP } from '../engine/toBSXMon'

export type BxMon = BSXMon
export type BxMove = BSXKeyMove
export type BxTickEv = BSXTickEv
export type BxTeamHP = TeamMemberHP

/** Spanish type names — the catalog's source language; `useBxLabels().type()` is the localized read. */
export const TYPE_ES: Record<string, string> = {
  Normal: "Normal", Fire: "Fuego", Water: "Agua", Electric: "Eléctrico", Grass: "Planta",
  Ice: "Hielo", Fighting: "Lucha", Poison: "Veneno", Ground: "Tierra", Flying: "Volador",
  Psychic: "Psíquico", Bug: "Bicho", Rock: "Roca", Ghost: "Fantasma", Dragon: "Dragón",
  Dark: "Siniestro", Steel: "Acero", Fairy: "Hada", Stellar: "Astral",
}

export const TYPE_IDS = Object.keys(TYPE_ES)

const TYPE_HEX: Record<string, string> = {
  Normal: "#9aa084", Fire: "#ee8130", Water: "#6390f0", Electric: "#f7d02c", Grass: "#7ac74c",
  Ice: "#74c6c2", Fighting: "#c22e28", Poison: "#a33ea1", Ground: "#d8b05a", Flying: "#a98ff3",
  Psychic: "#f95587", Bug: "#a6b91a", Rock: "#b6a136", Ghost: "#735797", Dragon: "#6f35fc",
  Dark: "#705746", Steel: "#8f8fa8", Fairy: "#d685ad", Stellar: "#7fd8c8",
}

// `--dim`, not `--txt-dim`: the Tailwind colour is named txt-dim but the CSS
// variable behind it is --dim, and an undefined var() invalidates the whole
// declaration rather than falling back.
export const tyColor = (t?: string) => (t && TYPE_HEX[t]) || "var(--dim)"
export const tyLabel = (t: string) => TYPE_ES[t] || t

// attacker → { defender: multiplier } (only entries ≠ 1)
const CHART: Record<string, Record<string, number>> = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
}

export const effMult = (moveType: string | undefined, defTypes: string[]) =>
  !moveType ? 1 : defTypes.reduce((m, d) => m * ((CHART[moveType] || {})[d] ?? 1), 1)

export type EffKey = "immune" | "super" | "x4" | "resist" | "x025"
export type EffTag = { key: EffKey; cls: "immune" | "super" | "weak" }
/** Effectiveness as a catalog key + emphasis class; the component resolves the word. */
export function effTag(m: number): EffTag | null {
  if (m === 0) return { key: "immune", cls: "immune" }
  if (m >= 2) return { key: m > 2 ? "x4" : "super", cls: "super" }
  if (m > 0 && m < 1) return { key: m < 0.5 ? "x025" : "resist", cls: "weak" }
  return null
}

/** The one HP tone: >50 ok · >20 warn · else bad. */
export const hpTone = (p: number) => (p > 50 ? "var(--ok)" : p > 20 ? "var(--warn)" : "var(--bad)")
export type HpBand = "ok" | "low" | "critical"
export const hpBand = (p: number): HpBand => (p > 50 ? "ok" : p > 20 ? "low" : "critical")

export const STATUS_IDS = ["brn", "par", "psn", "tox", "slp", "frz", "fnt"] as const
export const BOOST_IDS = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"] as const
export const CAT_IDS = ["phys", "spec", "status"] as const

const boostMult = (b: number) => (b >= 0 ? (2 + b) / 2 : 2 / (2 - b))
const statOf = (mon: BxMon, k: keyof BxMon["stats"]) => Math.round(mon.stats[k] * boostMult((mon.boosts as Record<string, number>)?.[k] || 0))
export const effSpeed = (mon: BxMon) => Math.round(statOf(mon, "spe") * (mon.status === "par" ? 0.5 : 1))

export interface OrderSlot { side: "ally" | "foe"; idx: number; mon: BxMon }
/** Projected action order by effective speed. */
export function speedOrder(slots: OrderSlot[]): (OrderSlot & { spe: number })[] {
  return slots
    .filter((s) => s.mon && !s.mon.fnt)
    .map((s) => ({ ...s, spe: effSpeed(s.mon) }))
    .sort((a, b) => b.spe - a.spe)
}

/** Showdown's id form: lowercase alphanumerics. */
export const toId = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
