import type { IconName } from "@/components/boffmedia/primitives"

export type BsimView = "lobby" | "equipos" | "repeticiones"
export type BsimMode = "ia" | "pvp" | "showdown"

/** In-app nav tabs shown in the tool bar. */
export const BSIM_TABS: { key: BsimView; icon: IconName }[] = [
  { key: "lobby", icon: "sword" },
  { key: "equipos", icon: "layers" },
  { key: "repeticiones", icon: "play" },
]

/** Play modes → the real battle route each one launches into. */
export const BSIM_MODES: { id: BsimMode; icon: IconName; href: string }[] = [
  { id: "ia", icon: "target", href: "/pokemon/battlesim/play" },
  { id: "pvp", icon: "sword", href: "/pokemon/battlesim/pvp" },
  { id: "showdown", icon: "globe", href: "/pokemon/battlesim/showdown" },
]

/** Real AI random-battle formats served by the battle gateway. */
export const BSIM_FORMATS = [
  { value: "gen9randombattle", label: "Gen 9 Random Battle" },
  { value: "gen8randombattle", label: "Gen 8 Random Battle" },
  { value: "gen7randombattle", label: "Gen 7 Random Battle" },
  { value: "gen6randombattle", label: "Gen 6 Random Battle" },
  { value: "gen9nationaldex", label: "National Dex" },
] as const

export const BSIM_FORMAT_KEY = "bsim_format"
