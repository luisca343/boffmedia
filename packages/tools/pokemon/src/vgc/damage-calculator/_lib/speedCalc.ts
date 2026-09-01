// Speed modifiers for the velocity view (mirrors the v2 SpeedView math).
export interface SpeedMods {
  tailwind: boolean
  scarf: boolean
  paralyzed: boolean
  trickRoom: boolean
  plus1: boolean
  plus2: boolean
  minus1: boolean
  minus2: boolean
}

export const EMPTY_SPEED_MODS: SpeedMods = {
  tailwind: false, scarf: false, paralyzed: false, trickRoom: false,
  plus1: false, plus2: false, minus1: false, minus2: false,
}

export function applySpeedMods(spd: number, m: SpeedMods): number {
  let s = spd
  if (m.tailwind) s = Math.floor(s * 2)
  if (m.paralyzed) s = Math.floor(s * 0.5)
  if (m.scarf) s = Math.floor(s * 1.5)
  if (m.plus2) s = Math.floor(s * 2)
  else if (m.plus1) s = Math.floor(s * 1.5)
  if (m.minus2) s = Math.floor(s * 0.5)
  else if (m.minus1) s = Math.floor(s * (2 / 3))
  return s
}

// Held-item speed multipliers (Choice Scarf, Iron Ball…).
export function applyItemSpeed(spd: number, item: string): number {
  if (item === "Choice Scarf") return Math.floor(spd * 1.5)
  if (item === "Iron Ball" || item === "Lagging Tail" || item === "Macho Brace") return Math.floor(spd * 0.5)
  return spd
}

// Mod pill order + their i18n keys under vgc.calc.speedView.
export const SPEED_MOD_KEYS: { k: keyof SpeedMods; i18n: string }[] = [
  { k: "tailwind", i18n: "tailwind" },
  { k: "scarf", i18n: "scarf" },
  { k: "paralyzed", i18n: "para" },
  { k: "trickRoom", i18n: "trickRoom" },
  { k: "plus1", i18n: "boostPlus1" },
  { k: "plus2", i18n: "boostPlus2" },
  { k: "minus1", i18n: "boostMinus1" },
  { k: "minus2", i18n: "boostMinus2" },
]
