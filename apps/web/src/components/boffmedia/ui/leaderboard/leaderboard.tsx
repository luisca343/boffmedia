"use client"

import * as React from "react"
import { BoffButton as Button } from "../../primitives/button"
import { BoffCard as Card } from "../../primitives/card"
import { BoffBadge as Badge } from "../../primitives/badge"
import { LeaderRow } from "./leader-row"

interface LeaderEntry {
  rank: number
  name: string
  pts: number
  you?: boolean
}

interface LeaderboardProps {
  leaders: LeaderEntry[]
  season?: string
  title?: string
  onViewAll?: () => void
}

export function Leaderboard({ leaders, season = "Temporada 3", title = "Top jugadores", onViewAll }: LeaderboardProps) {
  return (
    <Card ticks className="p-6 flex flex-col gap-[1.1rem]">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-xs tracking-[0.14em] uppercase text-[var(--text-dim)] block mb-[6px]">Clasificación</span>
          <h3 className="text-xl m-0">{title}</h3>
        </div>
        <Badge kind="accent">{season}</Badge>
      </div>
      <ul className="list-none m-0 p-0 flex flex-col">
        {leaders.map((p) => (
          <LeaderRow key={p.rank} rank={p.rank} name={p.name} pts={p.pts} you={p.you} />
        ))}
      </ul>
      {onViewAll && (
        <Button variant="ghost" block iconRight="arrow" onClick={onViewAll}>
          Ver clasificación completa
        </Button>
      )}
    </Card>
  )
}
