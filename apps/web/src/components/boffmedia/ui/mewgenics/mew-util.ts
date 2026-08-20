import type * as React from "react"
import type { IconName } from "@boffmedia/ui"

// v3 «Señal» — Mewgenics «Papel y tinta» Codex shared meta + pure helpers.
// Two palettes ship as CSS-var bundles applied on a scope wrapper: MEW_VARS is
// the default ink-violet "paper" desk (showcase), MEW_SENAL_VARS is the v3
// graphite + orange skin (the real /otros/mewgenics tool) — desk/accent pull from
// the v3 design tokens, the bone-paper sticker cards stay. Per-entity tint still
// arrives via inline --h (hue). The hand fonts (Luckiest Guy display / Shantell
// Sans hand) are self-hosted in styles/fonts.css; the stacks keep system fallbacks.

const WOB = {
  "--wob-a": "255px 15px 225px 15px / 15px 225px 15px 255px",
  "--wob-b": "15px 225px 15px 255px / 255px 15px 225px 15px",
  "--wob-c": "18px 165px 22px 155px / 155px 18px 175px 22px",
  "--wob-sm": "12px 18px 10px 16px / 16px 10px 18px 12px",
  "--mwp-hard": "0 4px 0 rgba(0,0,0,0.35)",
  "--mwf-disp": '"Luckiest Guy","Arial Rounded MT Bold",cursive',
  "--mwf-hand": '"Shantell Sans","Trebuchet MS",cursive',
} as const

// bone paper (light sticker cards) — shared across both skins
const PAPER = {
  "--mwp-paper": "#f2e9d3",
  "--mwp-paper-2": "#eadfc4",
  "--mwp-paper-3": "#dccdaa",
  "--mwp-good": "#47823f",
  "--mwp-warn": "#a86f14",
  "--mwp-bad": "#bf3333",
} as const

export const MEW_VARS = {
  "--mwp-night": "#191322",
  "--mwp-night-2": "#201a2e",
  "--mwp-night-3": "#2a2240",
  "--mwp-nline": "#3a2f55",
  "--mwp-cream": "#f0e7d4",
  "--mwp-cream-dim": "#a89bbd",
  ...PAPER,
  "--mwp-ink": "#33253d",
  "--mwp-ink-soft": "#6e6078",
  "--mwp-ink-line": "rgba(51,37,61,0.32)",
  "--mwp-red": "#d13a50",
  "--mwp-red-deep": "#97223a",
  "--mwp-pink": "#ef7d9d",
  "--mwp-tape": "rgba(245,238,220,0.28)",
  ...WOB,
} as React.CSSProperties

// v3 «Señal» skin — desk + accent map onto the Boffmedia v3 tokens
// (theme-reactive, with hex fallbacks); the cream index cards are retained.
export const MEW_SENAL_VARS = {
  "--mwp-night": "var(--base-deep, #0b0d11)",
  "--mwp-night-2": "var(--base-2, #12151b)",
  "--mwp-night-3": "var(--panel, #181c24)",
  "--mwp-nline": "var(--line, #2a3140)",
  "--mwp-cream": "var(--txt, #f2f4f8)",
  "--mwp-cream-dim": "var(--txt-muted, #9aa3b2)",
  ...PAPER,
  "--mwp-ink": "#191d24",
  "--mwp-ink-soft": "#5f6774",
  "--mwp-ink-line": "rgba(25,29,36,0.32)",
  "--mwp-red": "var(--accent, #ff5c0a)",
  "--mwp-red-deep": "#b23c00",
  "--mwp-pink": "var(--accent-bright, #ff7a33)",
  "--mwp-tape": "rgba(140,148,162,0.26)",
  ...WOB,
} as React.CSSProperties

export interface MewMeta {
  hue: number
  label: string
  singular?: string
  icon?: IconName
  rank?: number
}

export interface MewCat {
  key: string
  file: string | null
  icon: IconName
  hue: number
  /** abilities load lazily (large file) after the structural categories. */
  remote?: boolean
}

// Category definitions (order = tab order).
// `label` / `singular` / `desc` are NOT stored here — a module-scope t() would
// freeze whichever locale loaded first. Consumers resolve them against the
// `mewgenics` namespace as `cat.<key>.{label,singular,desc}` via `mewCatKey`.
export const MEW_CATS: MewCat[] = [
  { key: "items", file: "items.json", icon: "sword", hue: 44 },
  { key: "characters", file: "characters.json", icon: "paw", hue: 330 },
  { key: "abilities", file: null, icon: "bolt", hue: 200, remote: true },
  { key: "passives", file: "passives.json", icon: "shield", hue: 265 },
  { key: "keywords", file: "keywords.json", icon: "flame", hue: 12 },
  { key: "events", file: "events.json", icon: "compass", hue: 150 },
  { key: "classes", file: "classes.json", icon: "star", hue: 96 },
  { key: "maps", file: "maps.json", icon: "map", hue: 174 },
]

/** Message key for a category's chrome: `cat.<key>.label|singular|desc`. */
export const mewCatKey = (cat: string, leaf: "label" | "singular" | "desc") =>
  `cat.${cat}.${leaf}`
const CATBY: Record<string, MewCat> = {}
MEW_CATS.forEach((c) => { CATBY[c.key] = c })

const RARITY: Record<string, MewMeta> = {
  common: { hue: 220, label: "Común", rank: 1 },
  uncommon: { hue: 150, label: "Poco común", rank: 2 },
  rare: { hue: 210, label: "Raro", rank: 3 },
  very_rare: { hue: 285, label: "Muy raro", rank: 4 },
  consumable_common: { hue: 40, label: "Consumible", rank: 1 },
  consumable_uncommon: { hue: 150, label: "Consumible+", rank: 2 },
  consumable_rare: { hue: 210, label: "Consumible★", rank: 3 },
  consumable_very_rare: { hue: 285, label: "Consumible★★", rank: 4 },
  quest: { hue: 96, label: "Misión", rank: 3 },
  sidequest: { hue: 96, label: "Sub-misión", rank: 2 },
}
const FACTION: Record<string, MewMeta> = {
  enemies: { hue: 355, label: "Enemigo" },
  solitary_enemies: { hue: 20, label: "Solitario" },
  allies: { hue: 150, label: "Aliado" },
  birds: { hue: 200, label: "Pájaro" },
  cavemen: { hue: 40, label: "Cavernícola" },
  mammoths: { hue: 25, label: "Mamut" },
  sabertooths: { hue: 300, label: "Dientes de sable" },
  kaiju1: { hue: 320, label: "Kaiju" },
  kaiju2: { hue: 320, label: "Kaiju" },
  third_party: { hue: 230, label: "Neutral" },
  none: { hue: 230, label: "Objeto" },
}
const STATS = [
  { key: "strength", abbr: "FUE", label: "Fuerza" },
  { key: "dexterity", abbr: "DES", label: "Destreza" },
  { key: "constitution", abbr: "CON", label: "Constitución" },
  { key: "intelligence", abbr: "INT", label: "Inteligencia" },
  { key: "speed", abbr: "VEL", label: "Velocidad" },
  { key: "charisma", abbr: "CAR", label: "Carisma" },
]

export const MEW_STATMOD: Record<string, string> = {
  str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", spd: "Velocidad",
  cha: "Carisma", lck: "Suerte", speed: "Velocidad", shield: "Escudo", max_health: "Salud máx.",
  durability: "Durabilidad", max_durability: "Durabilidad máx.",
}

export const MEW = {
  cats: MEW_CATS,
  catBy: CATBY,
  rarity: (r?: string): MewMeta => RARITY[r || ""] || { hue: 230, label: r ? String(r) : "—", rank: 0 },
  faction: (f?: string): MewMeta => FACTION[f || ""] || { hue: 230, label: f ? String(f) : "—" },
  meta: { STATS, STATMOD: MEW_STATMOD, RARITY, FACTION },
}

export const MEW_KIND_LABEL: Record<string, string> = { weapon: "Arma", head: "Cabeza", face: "Cara", neck: "Cuello", trinket: "Abalorio", modifier: "Modificador", armor: "Armadura" }

const MEW_TOKEN_LABEL: Record<string, string> = {
  shield: "Escudo", divineshield: "Escudo divino", str: "FUE", dex: "DES", con: "CON", int: "INT",
  spd: "VEL", cha: "CAR", lck: "SUE", health: "Salud", mana: "Maná", crit: "Crít", block: "Bloqueo", exhaustion: "Agotamiento",
}
export const MEW_TOKEN_ICON: Record<string, IconName> = { shield: "shield", divineshield: "shield", health: "heart", crit: "target", block: "shield" }

/** Humanise a camelCase / SNAKE_CASE id → "Health Regen Up". */
export function mewHuman(k?: string): string {
  if (k == null) return ""
  let s = String(k)
  if (/^[A-Z0-9_]+$/.test(s)) {
    s = s.replace(/^(EVENT|ITEM|ENEMY|PASSIVE|KEYWORD|AREA|CAT|ARMOR|ABILITY|SPELL)_/i, "").replace(/_(NAME|DESC|QUES|ANSW|ANSWER|REW\d*|TITLE)$/i, "")
    return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim()
  }
  return s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").replace(/_/g, " ").trim()
}

export function mewTokenLabel(v: string): string {
  const k = String(v || "").toLowerCase()
  return MEW_TOKEN_LABEL[k] || mewHuman(v)
}

/** A localisation key that never resolved (ALL_CAPS_WORDS) → suppress. */
export function mewIsRawKey(s: unknown): boolean {
  return typeof s === "string" && /^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(s.trim())
}

/** A raw template token like "{itemname}" — never render as-is. */
export function mewIsRawToken(s: unknown): boolean {
  return !!s && /^\s*\{[a-z0-9_]+\}\s*$/i.test(String(s))
}

export function mewCleanName(s: unknown): string {
  return String(s == null ? "" : s).replace(/\[img:[^\]]+\]/g, "").replace(/\s+/g, " ").trim()
}

export function mewValidName(n?: string): boolean {
  return !!n && n !== "???" && n.indexOf("{") < 0 && n.indexOf("}") < 0 && !/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(n)
}

/** Resolve "{itemname}" placeholders in a sub-item name against its parent item. */
export function mewSubItemName(name: string | null | undefined, itemName?: string): string {
  if (name == null) return itemName || ""
  const s = String(name).replace(/\{item_?name\}/gi, itemName || "").trim()
  if (!s || mewIsRawToken(s)) return itemName || s
  return s
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
    if (m[1] != null) out.push({ t: "img", v: m[1].trim() })
    else out.push({ t: "ph", v: m[2].trim() })
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

// loose record shared by the presentational components + the normalized store
export interface MewRec {
  id: string
  name: string
  icon?: string | null
  sprite?: string | null
  rarity?: string
  faction?: string
  kind?: string
  hp?: number
  type?: string
  cls?: string
  desc?: string
  tip?: string
  tipPos?: string
  tipNeg?: string
  tipLess?: string
  nameNeg?: string
  subject?: string
  prompt?: string
  shield?: number
  durability?: number
  move?: number
  champ?: boolean
  atk?: string
  ability?: string
  attack?: string
  hasSprite?: boolean
  variant_of?: string
  template?: string
  chain?: string
  sub?: string
  spells?: string[]
  starters?: string[]
  abilities?: string[]
  weapon?: string
  passivePool?: string[]
  tags?: string[]
  global_tags?: string[]
  consumable?: boolean
  cursed?: boolean
  parasite?: boolean
  quest_item?: boolean
  indestructible?: boolean
  divine_shield?: boolean
  act?: number
  chapter?: number
  tileset?: string
  music?: string
  cost?: { act_points?: number; move_points?: number; requires_hp_threshold?: number }
  target?: { target_mode?: string; min_range?: number; max_range?: number; min_aoe?: number; max_aoe?: number }
  dmg?: { damage?: string; heal?: string; self?: string; splash?: string; type?: string; effects?: Record<string, unknown> }
  base?: Record<string, unknown>
  bonus?: Record<string, unknown>
  groups?: Record<string, string[]>
  statMods?: Record<string, unknown>
  stats?: Record<string, number>
  passives?: Record<string, unknown>
  equipment?: Record<string, unknown>
  innate_passives?: Record<string, unknown>
  ranks?: { r: number; desc?: string; passives?: Record<string, unknown> }[]
  set?: string | string[]
  bosses?: string[]
  minibosses?: string[]
  enemies?: Record<string, string[]>
  items?: Record<string, unknown>
  options?: MewEventOption[]
  members?: { id: string; name: string; kind: string }[]
  // normalization keys (localisation) + numeric stat mods live on the record too
  [extra: string]: unknown
}

export interface MewEventReward {
  prompt?: string
  [k: string]: unknown
}
// an outcome flattens the raw good/bad/flat branch (reward-map | random_pool |
// direct effects) into a uniform list of reward entries.
export interface MewEventOutcome {
  entries: MewEventReward[]
}
export interface MewEventOption {
  id: string
  label: string
  stat?: string
  good?: MewEventOutcome
  bad?: MewEventOutcome
  flat?: MewEventOutcome
}
