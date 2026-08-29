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
    <div className="relative z-[1] grid gap-[8px]">
      {winners.map((w, i) => (
        <div key={w.id} className="flex items-center gap-[14px] border border-line border-l-[3px] border-l-accent bg-panel-2 px-[16px] py-[12px]">
          <span className="min-w-[30px] font-display text-[20px] font-extrabold italic tabular-nums text-accent">{i + 1}</span>
          <Avatar accent className="h-[36px] w-[36px] flex-none text-[14px]">
            {initials(w.name)}
          </Avatar>
          <span className="min-w-0 flex-1 truncate font-display text-[18px] font-bold text-txt">{w.name}</span>
          <span className="flex-none font-mono text-[11px] font-medium tracking-[0.04em] text-txt-dim">
            {oddsOf(pool, w, weighted).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
