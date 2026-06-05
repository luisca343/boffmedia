"use client"

import { BSPokeChip } from "./bs-poke-chip"
import type { BSPokeChipMon } from "./bs-poke-chip"

interface BSTrackerProps {
  team: BSPokeChipMon[]
  sm?: boolean
}

export function BSTracker({ team, sm }: BSTrackerProps) {
  return (
    <div className="flex gap-[.35rem]">
      {team.map((m, i) => <BSPokeChip key={i} mon={m} sm={sm} />)}
    </div>
  )
}

export type { BSPokeChipMon }
