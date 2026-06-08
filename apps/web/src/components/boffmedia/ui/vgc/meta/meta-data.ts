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

export const TYPE_COLORS: Record<string, string> = {
  Normal: "#9fa19f", Fuego: "#e62829", Agua: "#2980ef", Eléctrico: "#fac000",
  Planta: "#3fa129", Hielo: "#3dcef3", Lucha: "#ff8000", Veneno: "#9141cb",
  Tierra: "#915121", Volador: "#81b9ef", Psíquico: "#ef4179", Bicho: "#91a119",
  Roca: "#afa981", Fantasma: "#704170", Dragón: "#5060e1", Siniestro: "#624d4e",
  Acero: "#60a1b8", Hada: "#ef70ef",
}

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

export interface PlayerEntry {
  slug: string
  placing: number
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

export interface TeamSlot {
  dex: number
  name: string
  tera: string
  item: string
  moves: string[]
}

export interface Format {
  id: string
  code: string
  label: string
  short: string
  note: string
  months: string[]
  base: [string, number][]
}

export interface TourReg {
  id: string
  name: string
  code: string
}

export interface DivergenceResult {
  rows: DivergenceRow[]
  ladderFormat: string
  ladderMonth: string
  rowCount: number
}

export interface DivergenceRow {
  id: string
  ladder: number
  tournament: number
  delta: number
  absDelta: number
  badge: string | null
}
