import type * as React from "react"
import type { IconName } from "@boffmedia/ui"

// v3 «Señal» — Mewgenics «Papel y tinta» Codex shared meta + pure helpers.
// Token sets have moved to CSS skins in globals.css (.mew-skin and .mew-skin-violet)
// to keep them themeable and centralised. The hand fonts (Luckiest Guy display /
// Shantell Sans hand) are self-hosted in styles/fonts.css.

export interface MewMeta {
  hue: number
  key: string
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
  { key: "furniture", file: "furniture.json", icon: "home", hue: 280 },
  { key: "mutations", file: "mutations.json", icon: "sparkles", hue: 120 },
  { key: "sets", file: "set_bonuses.json", icon: "layers", hue: 260 },
  { key: "story_cats", file: "story_cats.json", icon: "book", hue: 45 },
  { key: "statuses", file: null, icon: "flame", hue: 50 },
]

/** Message key for a category's chrome: `cat.<key>.label|singular|desc`. */
export const mewCatKey = (cat: string, leaf: "label" | "singular" | "desc") =>
  `cat.${cat}.${leaf}`
const CATBY: Record<string, MewCat> = {}
MEW_CATS.forEach((c) => { CATBY[c.key] = c })

const RARITY: Record<string, MewMeta> = {
  common: { hue: 220, key: "data.rarity.common", rank: 1 },
  uncommon: { hue: 150, key: "data.rarity.uncommon", rank: 2 },
  rare: { hue: 210, key: "data.rarity.rare", rank: 3 },
  very_rare: { hue: 285, key: "data.rarity.very_rare", rank: 4 },
  consumable_common: { hue: 40, key: "data.rarity.consumable_common", rank: 1 },
  consumable_uncommon: { hue: 150, key: "data.rarity.consumable_uncommon", rank: 2 },
  consumable_rare: { hue: 210, key: "data.rarity.consumable_rare", rank: 3 },
  consumable_very_rare: { hue: 285, key: "data.rarity.consumable_very_rare", rank: 4 },
  quest: { hue: 96, key: "data.rarity.quest", rank: 3 },
  sidequest: { hue: 96, key: "data.rarity.sidequest", rank: 2 },
}
const FACTION: Record<string, MewMeta> = {
  enemies: { hue: 355, key: "data.faction.enemies" },
  solitary_enemies: { hue: 20, key: "data.faction.solitary_enemies" },
  allies: { hue: 150, key: "data.faction.allies" },
  birds: { hue: 200, key: "data.faction.birds" },
  cavemen: { hue: 40, key: "data.faction.cavemen" },
  mammoths: { hue: 25, key: "data.faction.mammoths" },
  sabertooths: { hue: 300, key: "data.faction.sabertooths" },
  kaiju1: { hue: 320, key: "data.faction.kaiju1" },
  kaiju2: { hue: 320, key: "data.faction.kaiju2" },
  third_party: { hue: 230, key: "data.faction.third_party" },
  none: { hue: 230, key: "data.faction.none" },
}
// `code` is the game's canonical 3-letter stat id — it keys BOTH the i18n
// abbreviations (`stat.<code>`) and the token glyphs in ui_map.tokens, neither
// of which is localized. Never derive it from a localized abbreviation.
const STATS = [
  { key: "strength", code: "str" },
  { key: "dexterity", code: "dex" },
  { key: "constitution", code: "con" },
  { key: "intelligence", code: "int" },
  { key: "speed", code: "spd" },
  { key: "charisma", code: "cha" },
]

export const MEW_STATMOD: Record<string, string> = {
  str: "Fuerza", dex: "Destreza", con: "Constitución", int: "Inteligencia", spd: "Velocidad",
  cha: "Carisma", lck: "Suerte", speed: "Velocidad", shield: "Escudo", max_health: "Salud máx.",
  durability: "Durabilidad", max_durability: "Durabilidad máx.",
}

export const MEW = {
  cats: MEW_CATS,
  catBy: CATBY,
  rarity: (r?: string): MewMeta => RARITY[r || ""] || { hue: 230, key: r ? String(r) : "—", rank: 0 },
  faction: (f?: string): MewMeta => FACTION[f || ""] || { hue: 230, key: f ? String(f) : "—" },
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

/** Resolve a rarity key to its localized label. */
export function mewRarityLabel(t: (k: string) => string, rarity?: string): string {
  const m = MEW.rarity(rarity)
  if (m.key.startsWith("data.")) return t(m.key)
  return m.key || "—"
}

/** Resolve a faction key to its localized label. */
export function mewFactionLabel(t: (k: string) => string, faction?: string): string {
  const m = MEW.faction(faction)
  if (m.key.startsWith("data.")) return t(m.key)
  return m.key || "—"
}

/** Resolve a stat modifier key to its localized label. */
export function mewStatModLabel(t: (k: string) => string, modKey?: string): string {
  const statModMap: Record<string, string> = {
    "str": "data.statMod.str",
    "dex": "data.statMod.dex",
    "con": "data.statMod.con",
    "int": "data.statMod.int",
    "spd": "data.statMod.spd",
    "cha": "data.statMod.cha",
    "lck": "data.statMod.lck",
    "speed": "data.statMod.speed",
    "shield": "data.statMod.shield",
    "max_health": "data.statMod.max_health",
    "durability": "data.statMod.durability",
    "max_durability": "data.statMod.max_durability",
  }
  const i18nKey = statModMap[modKey || ""]
  return i18nKey ? t(i18nKey) : (modKey ? mewHuman(modKey) : "")
}

/** Resolve a stat name (luck, strength, etc) to its localized label. */
export function mewStatNameLabel(t: (k: string) => string, statKey?: string): string {
  const statNameMap: Record<string, string> = {
    "strength": "data.statName.strength",
    "dexterity": "data.statName.dexterity",
    "constitution": "data.statName.constitution",
    "intelligence": "data.statName.intelligence",
    "speed": "data.statName.speed",
    "charisma": "data.statName.charisma",
    "luck": "data.statName.luck",
  }
  const i18nKey = statNameMap[statKey || ""]
  return i18nKey ? t(i18nKey) : (statKey ? mewHuman(statKey) : "")
}

/** Resolve a token key to its localized label. */
export function mewTokenLabelI18n(t: (k: string) => string, v: string): string {
  const k = String(v || "").toLowerCase()
  const tokenKey = MEW_TOKEN_LABEL[k]
  if (!tokenKey) return mewHuman(v)
  // Map token keys to i18n paths
  const tokenI18nMap: Record<string, string> = {
    "FUE": "data.token.str",
    "DES": "data.token.dex",
    "CON": "data.token.con",
    "INT": "data.token.int",
    "VEL": "data.token.spd",
    "CAR": "data.token.cha",
    "SUE": "data.token.lck",
    "Escudo": "data.token.shield",
    "Escudo divino": "data.token.divineshield",
    "Salud": "data.token.health",
    "Maná": "data.token.mana",
    "Crít": "data.token.crit",
    "Bloqueo": "data.token.block",
    "Agotamiento": "data.token.exhaustion",
  }
  const i18nKey = tokenI18nMap[tokenKey]
  return i18nKey ? t(i18nKey) : tokenKey
}

/** The nine cat body parts mutations are grouped by. */
export const MEW_BODY_PARTS = ["body", "ears", "eyes", "eyebrows", "head", "legs", "mouth", "tail", "texture"]

/** Localized body-part name; falls back to humanising an unknown part. */
export function mewBodyPartLabel(t: (k: string) => string, part: string): string {
  const k = String(part || "").toLowerCase()
  return MEW_BODY_PARTS.includes(k) ? t(`filter.mutations.${k}`) : mewHuman(part)
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
  body_part?: string
  pieces_required?: number
  special?: boolean
  removed?: boolean
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
