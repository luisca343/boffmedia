"use client"

import { LeaderboardList } from "@/components/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@boffmedia/shared"

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
}

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-5" style={{ background: "rgba(249,115,22,0.6)" }} />
        <div>
          <h2
            className="text-sm font-black uppercase tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
          >
            Clasificación
          </h2>
          <p className="text-[10px] font-mono text-surface-500 mt-0.5">
            Tabla de posiciones actual
          </p>
        </div>
      </div>

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
