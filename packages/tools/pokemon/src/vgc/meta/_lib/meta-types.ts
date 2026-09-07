// Shared view-model types + stat/type/nature lookups for the VGC meta tool.
// Colours are canonical Pokémon values; type keys are Spanish (the API returns
// localized type names), matching the DkType hexes.

export const STAT_META: Record<string, { color: string }> = {
  hp:  { color: "#ff5959" },
  atk: { color: "#f5ac78" },
  def: { color: "#fae078" },
  spa: { color: "#9db7f5" },
  spd: { color: "#a7db8d" },
  spe: { color: "#fa92b2" },
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
export { TYPE_COLORS, TYPE_NAMES_EN, typeColor } from "@boffmedia/ui/datakit"

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
  moves: { name: string; pct: number; type?: string | null }[]
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
  ability?: string
  nature?: string
  ev?: number[]
  moves: string[]
  moveTypes?: Array<string | null>
}

export interface TeamEntry {
  slug: string
  name: string
  record: string
  source?: "vgcpastes" | "limitless" | "paste"
  rank?: string | null
  tournamentName: string | null
  tournamentDate: string | null
  team: TeamSlot[]
  rawText: string
}

export interface OverviewCore {
  size: number
  pokemon: { speciesId: string; speciesName: string }[]
  teamCount: number
  usagePercent: number
}

export interface OverviewTeam extends TeamEntry {
  tournamentName: string | null
  tournamentDate: string | null
  placing: number
}

export interface PlayerEntry {
  slug: string
  placing: number | null
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

export interface DivergenceRow {
  id: string
  name: string
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
