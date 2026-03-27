"use client"

import { LeaderboardList } from "@/components/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@boffmedia/shared"

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
}

export function Leaderboard({ leaderboard }: LeaderboardProps) {
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Clasificación</h2>
        <p className="text-surface-400">Tabla de posiciones actual</p>
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
