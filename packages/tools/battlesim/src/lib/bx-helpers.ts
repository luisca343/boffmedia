// Battle-HUD helpers for the v3 `Bx*` kit: type colours, HP tone, type
// effectiveness and projected speed order. Consumes the real engine's BSX
// shapes (English type keys).
//
// Every user-facing WORD used to live here as a Spanish map (CAT_ES,
// STATUS_ES, BOOST_ES…), which meant an English UI still printed Spanish
// chips. Those labels are catalog keys now — `useBxLabels()` in bx-kit resolves
// them — and this module keeps only data: colours, ids, numbers.
import type { BSXMon, BSXKeyMove, BSXTickEv, TeamMemberHP } from '../engine/toBSXMon'
import type { LedgerEntry } from '../engine/TurnLedger'

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

/**
 * The colour block beside a status pill. The pill's own background already
 * carries the tone (see `STATUS_BG` in bx-kit) — this is the 4px square that
 * makes it findable at a glance in a row of same-sized chips, and it is the
 * one place the two must agree, so both read from here.
 */
export const STATUS_DOT: Record<string, string> = {
  brn: "#ff7a33", par: "#f7d02c", psn: "#a33ea1", tox: "#7b2b79",
  slp: "var(--dim)", frz: "#74c6c2", fnt: "var(--line-2)",
}

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

/* ── Volatiles ───────────────────────────────────────────────────────────── */

/**
 * The volatiles a chip is worth, most decision-changing first.
 *
 * The client's volatile table holds a great deal that is not actionable
 * (`aquaring` on a mon you already know has it, animation-only markers, the
 * transform bookkeeping), and a plate that printed all of it would push the
 * boosts row off the bottom of a 260px card. This is the shortlist: the
 * things that change what you should DO on this turn.
 */
export const VOLATILE_IDS = [
  "substitute", "confusion", "leechseed", "taunt", "encore", "disable",
  "yawn", "attract", "curse", "torment", "healblock", "embargo",
  "destinybond", "protect",
] as const
export type VolatileId = (typeof VOLATILE_IDS)[number]

const VOLATILE_ORDER = new Map(VOLATILE_IDS.map((id, i) => [id as string, i]))

/** Tone per volatile: things done TO the mon read `--bad`, things it did read `--info`. */
export const VOLATILE_TONE: Record<string, string> = {
  substitute: "var(--info)", protect: "var(--info)", destinybond: "var(--warn)",
  confusion: "var(--warn)", yawn: "var(--warn)", attract: "var(--warn)",
  leechseed: "var(--bad)", taunt: "var(--bad)", encore: "var(--bad)",
  disable: "var(--bad)", curse: "var(--bad)", torment: "var(--bad)",
  healblock: "var(--bad)", embargo: "var(--bad)", perish: "var(--bad)",
}
export const volatileTone = (id: string) => VOLATILE_TONE[id] || "var(--line-2)"

/**
 * Perish Song's counter, which the client stores as the volatile's NAME
 * (`perish3` → `perish2` → …) rather than as a value on one volatile — so a
 * renderer that only looked for `perishsong` never found it.
 */
export function perishCount(volatiles?: string[] | null): number | null {
  if (!volatiles) return null
  for (const v of volatiles) {
    const m = /^perish(\d)$/.exec(v)
    if (m) return Number(m[1])
  }
  return null
}

/** {@link VOLATILE_IDS} present on this mon, in the shortlist's own order. */
export function shownVolatiles(volatiles?: string[] | null): string[] {
  if (!volatiles?.length) return []
  return volatiles
    .filter((v) => VOLATILE_ORDER.has(v))
    .sort((a, b) => (VOLATILE_ORDER.get(a) ?? 99) - (VOLATILE_ORDER.get(b) ?? 99))
}

/** `M`/`F` → the glyph the plate draws. Genderless mons get nothing, not an `N`. */
export const GENDER_GLYPH: Record<string, string> = { M: "♂", F: "♀" }

/* ── HP bar geometry ─────────────────────────────────────────────────────── */

/** One damage/heal event, as a signed percentage of max HP. */
export interface HpDelta {
  /** Index in `entry.events` — the label's React key, so it never depends on a timer. */
  i: number
  kind: "damage" | "heal"
  /** Always positive; `kind` carries the sign. */
  pct: number
}

/**
 * Everything the bar draws, in percent, derived from the ledger's ABSOLUTE
 * numbers rather than from watching the percentage change between renders.
 *
 * The old bar inferred "what was lost" by remembering its own previous
 * percentage. That cannot tell a two-hit move from a hit plus residual damage,
 * it counts a switch-in as a colossal heal, and its answer depends on when
 * React happened to re-render. The ledger already knows, event by event, so
 * this is arithmetic rather than inference — which is why it lives here with
 * the other numbers and is unit-tested without a DOM.
 */
export interface HpSegments {
  /** Live fill. */
  pct: number
  /** Where the bar stood when the turn began (or at switch-in). */
  startPct: number
  /** Width of the "lost this turn" band, drawn from `pct` rightwards. */
  lostPct: number
  /** Width of the "gained this turn" band, drawn from `startPct` rightwards. */
  gainedPct: number
  /** Damage events this turn — 2+ earns the `×N` chip. */
  hits: number
  deltas: HpDelta[]
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, n))

export function hpSegments(pct: number, entry?: LedgerEntry | null): HpSegments {
  const live = clamp100(pct)
  if (!entry) return { pct: live, startPct: live, lostPct: 0, gainedPct: 0, hits: 0, deltas: [] }

  const max = entry.maxhp > 0 ? entry.maxhp : entry.startMaxhp > 0 ? entry.startMaxhp : 0
  // No max means no percentage is meaningful — draw the live fill and nothing else.
  if (!max) return { pct: live, startPct: live, lostPct: 0, gainedPct: 0, hits: 0, deltas: [] }

  const startPct = clamp100((entry.startHp / max) * 100)
  // The NET band, not the sum of the events: damage-then-heal in one turn
  // leaves one segment, on the side the turn actually ended up.
  const lostPct = Math.max(0, startPct - live)
  const gainedPct = Math.max(0, live - startPct)

  const deltas: HpDelta[] = []
  let hits = 0
  entry.events.forEach((ev, i) => {
    if (ev.kind === "damage") hits++
    if (ev.kind !== "damage" && ev.kind !== "heal") return
    const delta = Math.abs(ev.to - ev.from)
    if (delta <= 0) return
    // Ceil, matching `hpPercent`: a hit that took anything at all must not
    // print "−0%".
    deltas.push({ i, kind: ev.kind, pct: Math.min(100, Math.max(1, Math.ceil((delta / max) * 100))) })
  })

  return { pct: live, startPct, lostPct, gainedPct, hits, deltas }
}
