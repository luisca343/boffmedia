import type { ReactNode } from "react"
import type { IconName } from "@/components/boffmedia/primitives"

// Demo content for the Sistema showcase ONLY. The real /perfil renders live
// session data and omits every section without a backing API — see
// docs/BOFFMEDIA_V3_DEFERRED.md for the deferred list.

export interface StatTileData {
  icon: IconName
  value: string
  em?: string
  label: string
  delta?: string
  deltaTone?: "up" | "acc"
}

export interface TrophyData {
  icon: IconName
  name: string
  meta?: string
  rare?: string
  done?: boolean
  locked?: boolean
}

export interface ActivityData {
  icon: IconName
  text: ReactNode
  time: string
}

export interface RankData {
  icon: IconName
  tier: string
  sub: string
  pct: number
  metaLeft: ReactNode
  metaRight: ReactNode
}

export interface TourData {
  name: string
  format: string
  where?: string // [deferred — no venue/series field on the tournament model; real page fills from gameTitle when present]
  stats?: { k: string; v: ReactNode }[] // gated — populated from the viewer's standings when the format exposes them
  roundLabel?: string // gated — only when the viewer has an active (unreported) match
  vs?: ReactNode // gated — opponent from the viewer's active match
}

export const DEMO_STATS: StatTileData[] = [
  { icon: "trophy", value: "#42", label: "Ranking global", delta: "Top 1%", deltaTone: "acc" },
  { icon: "bolt", value: "4 180", label: "Puntos", delta: "+210 esta semana", deltaTone: "up" },
  { icon: "chart", value: "73", em: "%", label: "Victorias", delta: "128 partidas" },
  { icon: "star", value: "37", label: "Logros", delta: "de 60" },
]

export const DEMO_RANK: RankData = {
  icon: "shield",
  tier: "Diamante II",
  sub: "Temporada 5",
  pct: 68,
  metaLeft: (
    <>
      3 200 <b>LP</b>
    </>
  ),
  metaRight: (
    <>
      <b>820</b> para Máster
    </>
  ),
}

export const DEMO_TROPHIES: TrophyData[] = [
  { icon: "trophy", name: "Campeón Regional", meta: "VGC · 2025", rare: "Raro", done: true },
  { icon: "zap", name: "Racha de 10", meta: "10 victorias", done: true },
  { icon: "calc", name: "Maestro del cálculo", meta: "500 cálculos", done: true },
  { icon: "sword", name: "Cazador veterano", meta: "MH Wilds", done: true },
  { icon: "cards", name: "Coleccionista TCG", meta: "Bloqueado", locked: true },
  { icon: "drop", name: "Pionero del sim", meta: "Bloqueado", locked: true },
]

export const DEMO_ACTIVITY: ActivityData[] = [
  {
    icon: "trophy",
    text: (
      <>
        Quedó 2º en <b>VGC Regional</b> — Series 2
      </>
    ),
    time: "hace 2 días",
  },
  {
    icon: "calc",
    text: (
      <>
        Guardó 3 sets en la <b>Calculadora de Daño</b>
      </>
    ),
    time: "hace 4 días",
  },
  {
    icon: "users",
    text: (
      <>
        Se unió al equipo <b>«Rotom Squad»</b>
      </>
    ),
    time: "hace 1 semana",
  },
]

export const DEMO_TOUR: TourData = {
  name: "Copa Boffmedia — Regional",
  where: "Online · Champions Series",
  format: "VGC Reg H",
  stats: [
    { k: "Ronda", v: <>4<em>/7</em></> },
    { k: "Récord", v: "3–0" },
    { k: "Resistencia", v: "78%" },
  ],
  roundLabel: "Ronda 4 · en curso",
  vs: (
    <>
      vs. <b>AshKetchum</b>
    </>
  ),
}
