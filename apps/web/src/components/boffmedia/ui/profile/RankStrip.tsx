import * as React from "react"
import { cn } from "@/lib/utils"
import { RankInsignia } from "./RankInsignia"
import { StatTile } from "./StatTile"
import type { RankData, StatTileData } from "./profile-data"

export interface RankStripProps {
  rank: RankData
  stats: StatTileData[]
  className?: string
}

export function RankStrip({ rank, stats, className }: RankStripProps) {
  return (
    <div
      className={cn(
        "grid items-stretch gap-4 [grid-template-columns:21.75rem_1fr] max-[1080px]:grid-cols-1",
        className,
      )}
    >
      <RankInsignia {...rank} />
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(9.25rem,1fr))]">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>
    </div>
  )
}
