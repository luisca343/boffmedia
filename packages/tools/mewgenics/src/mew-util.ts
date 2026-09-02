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

/**
 * Class colours, read straight out of the game's `palette.png`: each class
 * declares a `graphics.palette` row index and the row's mid-tone is the colour
 * the cat is actually painted in. Sampled once (column 3 of the row, the middle
 * shade) rather than at runtime — the palette lives on the static asset host,
 * so a canvas read of it would taint on a cross-origin NEXT_PUBLIC_STATIC_URL.
 *
 * Keyed by palette index, not by class name, so any entity carrying a palette
 * (story cats included) resolves through the same table.
 */
const MEW_PALETTE_INK: Record<number, string> = {
  50: "#375133", // Hunter    — moss
  51: "#645431", // Tank      — brass
  52: "#f6f4f4", // Medic     — bone white
  53: "#ebe7a3", // Thief     — pale gold
  54: "#9f6565", // Fighter   — brick
  55: "#9493b8", // Mage      — periwinkle
  62: "#4e415f", // Psychic   — violet
  63: "#97dfcb", // Tinkerer  — mint
  64: "#8f3747", // Butcher   — blood
  65: "#4d362d", // Druid     — bark
  66: "#3b3b3b", // Monk      — slate
  68: "#1b1b1b", // Necromancer — pitch
}

/** Relative luminance (sRGB, WCAG). */
function mewLuma(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

/**
 * The class's colour, and a version of it that stays legible as ink on the
 * cream paper. Medic's palette is bone-white and Necromancer's is near-black;
 * both are the right colour and the wrong contrast, so the readable variant is
 * mixed toward ink or lifted toward paper only as far as it has to be.
 */
export function mewClassColor(palette?: number): { raw: string; readable: string } | null {
  if (palette == null) return null
  const raw = MEW_PALETTE_INK[palette]
  if (!raw) return null
  const l = mewLuma(raw)
  // Cream paper sits around L≈0.82; anything lighter than ~0.5 needs darkening
  // to read on it, anything under ~0.03 gets lifted so it is not a black blob.
  const readable =
    l > 0.5 ? `color-mix(in srgb, ${raw} 62%, var(--mwp-ink))`
    : l < 0.03 ? `color-mix(in srgb, ${raw} 72%, var(--mwp-paper))`
    : raw
  return { raw, readable }
}

/**
 * Status glyph colours. All 126 statuses share three line-art glyphs (one per
 * kind), so an untinted grid is a wall of identical skulls. The tint is taken
 * from the data wherever the data has one:
 *
 *  - elite buffs → `EliteFlatTint`, the RGB multiplier the game applies to the
 *    elite's own sprite. Multiplying a neutral grey by it reproduces the tint
 *    the player sees in combat.
 *  - weather → its effect keys, which name the phenomenon (Rain, Snow,
 *    FireStorm, RandomLightning…).
 *  - injuries → one wound tone; they are all the same kind of harm.
 */
const MEW_WEATHER_HUE: Record<string, number> = {
  Rain: 205, AcidRain: 88, Snow: 195, Windy: 170, FireStorm: 18, Meteornado: 26,
  RandomLightning: 52, LowerAmbientLight: 260, SpawnVolcanoOnBattleStart: 12,
  FactionUprising: 340, StatusCharactersOnRoundEnd: 300,
  CharacterTypeGainsStatusAtBattleStart: 285, SpawnExtraThingsOnBattleStart: 150,
}

function mewTintToHex(t: unknown[]): string | null {
  const c = t.slice(0, 3).map((v) => (typeof v === "number" ? v : 1))
  if (c.length < 3) return null
  // A mid grey stands in for the sprite the multiplier is applied to.
  const px = c.map((m) => Math.max(0, Math.min(255, Math.round(168 * m))))
  // A tint that lands on pure grey carries no colour information — skip it so
  // deliberately monochrome buffs stay monochrome.
  if (px[0] === px[1] && px[1] === px[2]) return null
  return "#" + px.map((v) => v.toString(16).padStart(2, "0")).join("")
}

/** A CSS colour for a status glyph, or null to leave it monochrome. */
export function mewStatusColor(rec: MewRec): string | null {
  const kind = typeof rec.status_kind === "string" ? rec.status_kind : ""
  if (kind === "injuries") return "hsl(352 46% 42%)"
  if (kind === "elite_buffs") {
    const p = rec.passives as Record<string, unknown> | undefined
    const tint = p && Array.isArray(p.EliteFlatTint) ? mewTintToHex(p.EliteFlatTint as unknown[]) : null
    return tint || "hsl(276 40% 46%)"
  }
  if (kind === "weather") {
    const eff = rec.effects as Record<string, unknown> | undefined
    for (const k of Object.keys(eff || {})) {
      if (MEW_WEATHER_HUE[k] != null) return `hsl(${MEW_WEATHER_HUE[k]} 48% 40%)`
    }
    return "hsl(205 42% 42%)"
  }
  return null
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
  /** Mutation with no description and no passive — a bare numbered stat roll. */
  numbered?: boolean
  /** palette.png row index (classes, story cats) — the entity's colour ramp. */
  palette?: number
  /** Alternate intro prompts a world counter switches between (events). */
  introVariants?: { prompt: string; when?: string }[]
  // normalization keys (localisation) + numeric stat mods live on the record too
  [extra: string]: unknown
}

export interface MewEventReward {
  prompt?: string
  /** `common` | `rare` when the branch came from a `reward { common rare }` map. */
  tier?: string
  /** Relative weight inside a `random_pool`. */
  weight?: number
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
  /** The tested stat: one of the seven real stats, `none`, or the `coins` /
   *  `quest` pseudo-stats (an entry cost, not a roll). */
  stat?: string
  good?: MewEventOutcome
  bad?: MewEventOutcome
  flat?: MewEventOutcome
  /** Flat success chance (0…1) that replaces the stat roll entirely. */
  fixedChance?: number
  /** Entry cost for the `coins` / `quest` pseudo-stats. */
  statMin?: number
  statMax?: number
  /** Raw gating requirements the game checks before offering the option. */
  reqs?: Record<string, unknown>
}
