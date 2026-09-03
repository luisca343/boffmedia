"use client"

import * as React from "react"
import { Avatar } from "@boffmedia/ui"
import { initials, oddsOf, type Entrant } from "./draw-util"

export interface SrtWinnerListProps {
  winners: Entrant[]
  pool: Entrant[]
  weighted: boolean
}

export function SrtWinnerList({ winners, pool, weighted }: SrtWinnerListProps) {
  return (
    <div className="relative z-[1] grid gap-[0.5rem]">
      {winners.map((w, i) => (
        <div key={w.id} className="flex items-center gap-[0.875rem] border border-line border-l-[3px] border-l-accent bg-panel-2 px-[1rem] py-[0.75rem]">
          <span className="min-w-[1.875rem] font-display text-[1.25rem] font-extrabold italic tabular-nums text-accent">{i + 1}</span>
          <Avatar accent className="h-[2.25rem] w-[2.25rem] flex-none text-[0.875rem]">
            {initials(w.name)}
          </Avatar>
          <span className="min-w-0 flex-1 truncate font-display text-[1.125rem] font-bold text-txt">{w.name}</span>
          <span className="flex-none font-mono text-[0.6875rem] font-medium tracking-[0.04em] text-txt-dim">
            {oddsOf(pool, w, weighted).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
