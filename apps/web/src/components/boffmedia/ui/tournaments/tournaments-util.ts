import type { IconName } from "@/components/boffmedia/primitives"

// Generic tournament competitor: a solo player, a team/squad or a scoring entry.
// Sourced from the (future) tournaments API. [deferred]
export type TnKind = "solo" | "team" | "entry"

export interface TnCompetitor {
  id: string
  kind: TnKind
  name: string
  tag?: string
  flag?: string
  country?: string
  countryName?: string
  seed?: number
  hue?: number
  avatar?: string
  roster?: unknown[]
  // records / extra fields tolerated by the standings + live views
  w?: number
  l?: number
  d?: number
  pts?: number
}

export const TN_FORMAT_LABEL: Record<string, string> = {
  swiss: "Suizo",
  single: "Eliminación",
  double: "Doble elim.",
  groups: "Grupos + eliminatoria",
  roundrobin: "Liga (todos contra todos)",
  leaderboard: "Clasificación libre",
}

export const TN_FORMAT_ICON: Record<string, IconName> = {
  swiss: "list",
  single: "trophy",
  double: "trophy",
  groups: "grid",
  roundrobin: "list",
  leaderboard: "chart",
}

/** A single elimination match seat pairing. */
export interface TnMatch {
  top: TnCompetitor | null
  bot: TnCompetitor | null
  topSeed?: number | null
  botSeed?: number | null
  g1: number | null
  g2: number | null
  status: string
  winner?: TnCompetitor | null
  bracket?: string
  reset?: boolean
}
