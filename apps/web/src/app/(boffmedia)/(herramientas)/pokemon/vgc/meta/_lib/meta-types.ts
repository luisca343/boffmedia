// Shared view-model types + stat/type/nature lookups for the VGC meta tool.
// Colours are canonical Pokémon values; type keys are Spanish (the API returns
// localized type names), matching the DkType hexes.

export const STAT_META: Record<string, { label: string; color: string }> = {
  hp:  { label: "PS",  color: "#ff5959" },
  atk: { label: "Atq", color: "#f5ac78" },
  def: { label: "Def", color: "#fae078" },
  spa: { label: "AtE", color: "#9db7f5" },
  spd: { label: "DfE", color: "#a7db8d" },
  spe: { label: "Vel", color: "#fa92b2" },
}

export const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"] as const

export const NATURE_CHANGES: Record<string, { plus: string; minus: string } | null> = {
  Hardy: null, Docile: null, Serious: null, Bashful: null, Quirky: null,
  Lonely:  { plus: "atk", minus: "def" }, Brave:   { plus: "atk", minus: "spe" },
  Adamant: { plus: "atk", minus: "spa" }, Naughty: { plus: "atk", minus: "spd" },
  Bold:    { plus: "def", minus: "atk" }, Relaxed: { plus: "def", minus: "spe" },
  Impish:  { plus: "def", minus: "spa" }, Lax:     { plus: "def", minus: "spd" },
  Modest:  { plus: "spa", minus: "atk" }, Mild:    { plus: "spa", minus: "def" },
  Quiet:   { plus: "spa", minus: "spe" }, Rash:    { plus: "spa", minus: "spd" },
  Calm:    { plus: "spd", minus: "atk" }, Gentle:  { plus: "spd", minus: "def" },
  Sassy:   { plus: "spd", minus: "spe" }, Careful: { plus: "spd", minus: "spa" },
  Timid:   { plus: "spe", minus: "atk" }, Hasty:   { plus: "spe", minus: "def" },
  Jolly:   { plus: "spe", minus: "spa" }, Naive:   { plus: "spe", minus: "spd" },
}

// Same palette as every other Pokémon tool — see the datakit. The local copy
// this replaces also fell back to `var(--txt-dim)`, which is not a token in this
// system (`--dim` is), so an unknown type rendered with no colour at all.
export { TYPE_COLORS, TYPE_NAMES_EN, typeColor } from "@/components/boffmedia/ui/tools/datakit"

/** Thousands-separated count (Spanish dot grouping): 12345 → "12.345". */
export function fmtCount(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export interface PokeData {
  id: string
  name: string
  dex: number
  types: string[]
  base: Record<string, number>
  abilities: { name: string; pct: number }[]
  items: { name: string; pct: number }[]
  moves: { name: string; pct: number }[]
  tera: { name: string; pct: number }[]
  mates: { id: string; pct: number }[]
  spreads: { nature: string; ev: number[]; pct: number }[]
}

export interface UsageEntry {
  id: string
  usage: number
  count: number
}

export interface TeamSlot {
  dex: number
  name: string
  tera: string
  item: string
  moves: string[]
}

export interface TeamEntry {
  slug: string
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

export interface PlayerEntry {
  slug: string
  placing: number
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

export interface DivergenceRow {
  id: string
  ladder: number
  tournament: number
  delta: number
  absDelta: number
  badge: string | null
}

export interface DivergenceResult {
  rows: DivergenceRow[]
  ladderFormat: string
  ladderMonth: string
  rowCount: number
}
