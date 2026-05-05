export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'
export type StatValues = Record<StatKey, number>

// Champions format uses SP (Spirit Points) instead of EVs.
// SP budget: 66 total, max 32 per stat (vs EV: 510 total, max 252 per stat).
// SP is used by Champions VGC format (gen9championsvgc2026regma and variants).
// When useChampions is true, evs field contains SP values (0–32 per stat).
export interface CalcMove {
  name: string
  bp: number
  type: string
  category: 'Physical' | 'Special' | 'Status'
  crit: boolean
}

export type MoveSlots = [CalcMove, CalcMove, CalcMove, CalcMove]

export type BoostKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe'
export type StatBoosts = Record<BoostKey, number>

export interface CalcPokemon {
  name: string
  level: number
  nature: string
  ability: string
  item: string
  status: string
  teraType: string
  evs: StatValues
  ivs: StatValues
  boosts: StatBoosts
  currentHP: number // -1 = full HP
  moves: MoveSlots
}

export type Weather =
  | 'None'
  | 'Sun'
  | 'Rain'
  | 'Sand'
  | 'Snow'
  | 'Harsh Sunshine'
  | 'Heavy Rain'
  | 'Strong Winds'

export type Terrain = 'None' | 'Electric' | 'Grassy' | 'Misty' | 'Psychic'

export type GameFormat = 'Singles' | 'Doubles'

export interface SideConditions {
  stealthRock: boolean
  spikes: 0 | 1 | 2 | 3
  reflect: boolean
  lightScreen: boolean
  auroraVeil: boolean
  tailwind: boolean
  helpingHand: boolean
}

export interface CalcField {
  format: GameFormat
  weather: Weather
  terrain: Terrain
  trickRoom: boolean
  gravity: boolean
  magicRoom: boolean
  wonderRoom: boolean
  attackerSide: SideConditions
  defenderSide: SideConditions
}

export interface DamageResult {
  rolls: number[]
  min: number
  max: number
  minPct: number
  maxPct: number
  defHP: number
  isPhysical: boolean
  desc: string
}

export type CalcTab = '1v1' | 'teamvsmany' | 'manyvsteam' | 'speed' | 'typecalc'
