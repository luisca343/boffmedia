"use client"

import { Trophy } from "lucide-react"
import { LeaderboardList } from "@/components/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@boffmedia/shared"
import { EventSectionHeader } from "./EventSectionHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  const top = Math.min(leaderboard.length, 10)

  const badge = top > 0 ? (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-widest"
      style={{
        color: "rgba(250,204,21,0.9)",
        border: "1px solid rgba(250,204,21,0.3)",
        background: "rgba(250,204,21,0.07)",
      }}
    >
      <Trophy className="w-3 h-3" />
      Top {top}
    </span>
  ) : null

  return (
    <div className="space-y-4">
      <EventSectionHeader
        label="Clasificación"
        sub="Tabla de posiciones actual"
        accentColor="rgba(250,204,21,0.6)"
        badge={badge}
      />

      <LeaderboardList
        players={leaderboard}
        useProfileImage={false}
        maxItems={10}
        emptyStateTitle="Clasificación vacía"
        emptyStateDescription="Los resultados aparecerán cuando comience la competición"
      />
    </div>
  )
}
