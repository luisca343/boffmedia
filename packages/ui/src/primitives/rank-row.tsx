import * as React from "react"
import { cn } from "../cn"

export function Rank({ children }: { children: React.ReactNode }) {
  return <div className="border border-solid border-line bg-panel">{children}</div>
}

export interface RankRowProps {
  rank: React.ReactNode
  name: string
  team?: string
  pts: React.ReactNode
  unit?: string
  top3?: boolean
}

export function RankRow({ rank, name, team, pts, unit, top3 }: RankRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 border-b border-line px-[1.125rem] py-[0.6875rem] transition-colors duration-[140ms] last:border-b-0 hover:bg-panel-2",
        top3 && "bg-[linear-gradient(90deg,var(--accent-soft),transparent_55%)]",
      )}
    >
      <span className="w-[2.125rem] shrink-0 font-display text-[1.5rem] font-extrabold italic leading-none text-accent">{rank}</span>
      <div>
        <span className="font-display text-[1.125rem] font-bold uppercase leading-[1.1]">{name}</span>
        {team && (
          <span className="mt-[3px] block font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.08em] text-txt-muted">
            {team}
          </span>
        )}
      </div>
      <span className="ml-auto font-mono text-[0.9375rem] font-semibold leading-none">
        {pts}
        {unit && <small className="ml-1 text-[0.625rem] text-txt-muted">{unit}</small>}
      </span>
    </div>
  )
}
