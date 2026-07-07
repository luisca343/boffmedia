import * as React from "react"
import { cn } from "@/lib/utils"

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
        "flex items-center gap-3.5 border-b border-line px-[18px] py-[11px] transition-colors duration-[140ms] last:border-b-0 hover:bg-panel-2",
        top3 && "bg-[linear-gradient(90deg,var(--accent-soft),transparent_55%)]",
      )}
    >
      <span className="w-[34px] shrink-0 font-display text-[24px] font-extrabold italic leading-none text-accent">{rank}</span>
      <div>
        <span className="font-display text-[18px] font-bold uppercase leading-[1.1]">{name}</span>
        {team && (
          <span className="mt-[3px] block font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-txt-muted">
            {team}
          </span>
        )}
      </div>
      <span className="ml-auto font-mono text-[15px] font-semibold leading-none">
        {pts}
        {unit && <small className="ml-1 text-[10px] text-txt-muted">{unit}</small>}
      </span>
    </div>
  )
}
