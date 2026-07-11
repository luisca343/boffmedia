import type * as React from "react"
import type { IconName } from "@/components/boffmedia/primitives"

// v3 «Señal» — Mewgenics «Papel y tinta» Codex shared helpers + mock data layer.
// Mirrors the window.MEW globals from v3-mew-data.jsx, reduced to what the
// showcase specimens read. Self-contained (no dataset load). [deferred]
// NOTE: the hand-drawn fonts (Luckiest Guy · Shantell Sans) aren't self-hosted
// locally yet, so --mwf-* fall back to rounded/cursive stacks. [deferred]

export const MEW_VARS = {
  "--mwp-night": "#191322",
  "--mwp-night-2": "#201a2e",
  "--mwp-night-3": "#2a2240",
  "--mwp-nline": "#3a2f55",
  "--mwp-cream": "#f0e7d4",
  "--mwp-cream-dim": "#a89bbd",
  "--mwp-paper": "#f2e9d3",
  "--mwp-paper-2": "#eadfc4",
  "--mwp-paper-3": "#dccdaa",
  "--mwp-ink": "#33253d",
  "--mwp-ink-soft": "#6e6078",
  "--mwp-ink-line": "rgba(51,37,61,0.32)",
  "--mwp-red": "#d13a50",
  "--mwp-red-deep": "#97223a",
  "--mwp-pink": "#ef7d9d",
  "--mwp-good": "#47823f",
  "--mwp-warn": "#a86f14",
  "--mwp-bad": "#bf3333",
  "--wob-a": "255px 15px 225px 15px / 15px 225px 15px 255px",
  "--wob-b": "15px 225px 15px 255px / 255px 15px 225px 15px",
  "--wob-c": "18px 165px 22px 155px / 155px 18px 175px 22px",
  "--wob-sm": "12px 18px 10px 16px / 16px 10px 18px 12px",
  "--mwp-tape": "rgba(245,238,220,0.28)",
  "--mwp-hard": "0 4px 0 rgba(0,0,0,0.35)",
  "--mwf-disp": '"Luckiest Guy","Arial Rounded MT Bold",cursive',
  "--mwf-hand": '"Shantell Sans","Trebuchet MS",cursive',
} as React.CSSProperties

export interface MewMeta {
  hue: number
  label: string
  singular?: string
  icon?: IconName
  rank?: number
}

const RARITY: Record<string, MewMeta> = {
  common: { hue: 220, label: "Común", rank: 1 },
  uncommon: { hue: 150, label: "Poco común", rank: 2 },
  rare: { hue: 210, label: "Raro", rank: 3 },
  very_rare: { hue: 285, label: "Muy raro", rank: 4 },
}
const FACTION: Record<string, MewMeta> = {
  enemies: { hue: 0, label: "Enemigos" },
  allies: { hue: 150, label: "Aliados" },
  birds: { hue: 45, label: "Pájaros" },
}
const CATBY: Record<string, MewMeta> = {
  items: { hue: 210, label: "Objetos", singular: "objeto", icon: "sword" },
  characters: { hue: 0, label: "Personajes", singular: "personaje", icon: "paw" },
  passives: { hue: 150, label: "Pasivas", singular: "pasiva", icon: "shield" },
  abilities: { hue: 280, label: "Habilidades", singular: "habilidad", icon: "bolt" },
  keywords: { hue: 35, label: "Estados", singular: "estado", icon: "flame" },
  events: { hue: 320, label: "Eventos", singular: "evento", icon: "grid" },
  maps: { hue: 190, label: "Mapas", singular: "mapa", icon: "map" },
  sets: { hue: 40, label: "Conjuntos", singular: "conjunto", icon: "layers" },
}
const STATS = [
  { key: "strength", abbr: "FUE", label: "Fuerza" },
  { key: "dexterity", abbr: "DES", label: "Destreza" },
  { key: "constitution", abbr: "CON", label: "Constitución" },
  { key: "intelligence", abbr: "INT", label: "Inteligencia" },
  { key: "speed", abbr: "VEL", label: "Velocidad" },
  { key: "charisma", abbr: "CAR", label: "Carisma" },
]

export const MEW = {
  rarity: (r?: string): MewMeta => RARITY[r || ""] || RARITY.common,
  faction: (f?: string): MewMeta => FACTION[f || ""] || FACTION.enemies,
  catBy: CATBY,
  meta: { STATS },
}

export const MEW_KIND_LABEL: Record<string, string> = { weapon: "Arma", head: "Cabeza", face: "Cara", neck: "Cuello", trinket: "Abalorio", modifier: "Modificador", armor: "Armadura" }

const MEW_TOKEN_LABEL: Record<string, string> = { shield: "Escudo", int: "INT", str: "FUE", health: "Salud", crit: "Crítico", block: "Bloqueo", divineshield: "Escudo divino" }
export const MEW_TOKEN_ICON: Record<string, IconName> = { shield: "shield", divineshield: "shield", health: "heart", crit: "target", block: "shield" }

/** Humanise a camelCase/snake id → "Health Regen Up". */
export function mewHuman(k?: string): string {
  if (!k) return ""
  return String(k)
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function mewTokenLabel(v: string): string {
  const k = String(v || "").toLowerCase()
  return MEW_TOKEN_LABEL[k] || mewHuman(v)
}

/** A localisation key that never resolved (ALL_CAPS_WORDS) → suppress. */
export function mewIsRawKey(s: unknown): boolean {
  return typeof s === "string" && /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(s.trim())
}

export type MewSeg = { t: "txt" | "img" | "ph"; v: string }
/** Parse a line into text / [img:token] / {placeholder} segments. */
export function mewParseText(line: string): MewSeg[] {
  const out: MewSeg[] = []
  const re = /\[img:([^\]]+)\]|\{([^}]+)\}/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ t: "txt", v: line.slice(last, m.index) })
    if (m[1] != null) out.push({ t: "img", v: m[1] })
    else out.push({ t: "ph", v: m[2] })
    last = re.lastIndex
  }
  if (last < line.length) out.push({ t: "txt", v: line.slice(last) })
  return out
}

export function mewMonogram(name?: string, id?: string): string {
  const s = (name || id || "?").replace(/[^A-Za-z0-9 ]/g, "").trim()
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase() || "?"
}

export function mewHueFor(cat: string, rec: MewRec): number {
  if (cat === "items") return MEW.rarity(rec.rarity).hue
  if (cat === "characters") return MEW.faction(rec.faction).hue
  return MEW.catBy[cat] ? MEW.catBy[cat].hue : 230
}

export function mewClip(s?: string, n = 140): string {
  if (!s) return ""
  const t = String(s).replace(/\r/g, "").trim()
  if (/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(t)) return ""
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t
}

// loose record type shared by the presentational components (mock data)
export interface MewRec {
  id: string
  name: string
  rarity?: string
  faction?: string
  kind?: string
  hp?: number
  type?: string
  cls?: string
  desc?: string
  tip?: string
  shield?: number
  durability?: number
  cost?: { act_points?: number; move_points?: number }
  target?: { target_mode?: string; min_range?: number; max_range?: number }
  dmg?: { damage?: string; heal?: string; type?: string; effects?: Record<string, unknown> }
  base?: Record<string, unknown>
  ranks?: { r: number }[]
  passives?: Record<string, unknown>
  members?: { id: string; name: string; kind: string }[]
  stats?: Record<string, number>
}
