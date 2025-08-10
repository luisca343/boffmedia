import { Trophy, Medal, Crown, Award, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileImage } from "@/components/ProfileImage"
import type { LeaderboardEntry } from "@/types/events"

type MedalsLeaderboardProps = {
  currentPlayers: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
  filteredPlayers: LeaderboardEntry[]
  currentPage: number
  playersPerPage: number
}

export function MedalsLeaderboard({
  currentPlayers,
  getPlayerRank,
  filteredPlayers,
  currentPage,
  playersPerPage,
}: MedalsLeaderboardProps) {
  const sortedPlayers = [...currentPlayers].sort((a, b) => (b.medalCount || 0) - (a.medalCount || 0))

  if (sortedPlayers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Medal className="w-12 h-12 text-surface-400" />
        </div>
        <h3 className="text-xl font-semibold text-surface-300 mb-2">No hay medallas ganadas todavía</h3>
        <p className="text-surface-400 max-w-md mx-auto">
          Participa en eventos para ganar medallas y puntos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedPlayers.map((player) => {
        const medalRank = [...filteredPlayers]
          .sort((a, b) => (b.medalCount || 0) - (a.medalCount || 0))
          .findIndex((p) => p.userId === player.userId) + 1 + (currentPage - 1) * playersPerPage
        
        const index = medalRank - 1

        return (
          <Card 
            key={player.userId} 
            className={`bg-surface-800/60 backdrop-blur-sm transition-all hover:scale-105 ${
              index < 3 
                ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10' 
                : 'border-accent-500/20'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-surface-300 to-surface-500 text-black' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                  'bg-gradient-to-br from-accent-600 to-indigo-600 text-white'
                }`}>
                  {index < 3 ? (
                    index === 0 ? <Crown className="w-6 h-6" /> :
                    index === 1 ? <Medal className="w-6 h-6" /> :
                    <Award className="w-6 h-6" />
                  ) : (
                    medalRank
                  )}
                </div>
                
                <ProfileImage userId={player.userId} />
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {player.nickname || `Jugador ${player.userId}`}
                  </h3>
                  <p className="text-surface-400 text-sm">
                    Especialista en medallas
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <Medal className="h-5 w-5 text-primary-500" />
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                      {player.medalCount || 0}
                    </span>
                  </div>
                  <div className="text-surface-400 text-sm">medallas</div>
                  <div className="text-xs text-surface-500 mt-1">
                    {player.medalPoints || 0} puntos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

