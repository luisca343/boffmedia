import { Trophy, Award } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { ProfileImage } from "@/components/ProfileImage"
import type { LeaderboardEntry } from "@/types/events"

type AchievementsLeaderboardProps = {
  currentPlayers: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
  filteredPlayers: LeaderboardEntry[]
  currentPage: number
  playersPerPage: number
}

export function AchievementsLeaderboard({
  currentPlayers,
  getPlayerRank,
  filteredPlayers,
  currentPage,
  playersPerPage,
}: AchievementsLeaderboardProps) {
  return (
    <>
      {currentPlayers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="px-4 py-3 text-left text-surface-300 font-medium">Posición</th>
                <th className="px-4 py-3 text-left text-surface-300 font-medium">Jugador</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Logros</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Puntos de Logros</th>
              </tr>
            </thead>
            <tbody>
              {[...currentPlayers]
                .sort((a, b) => (b.achievementCount || 0) - (a.achievementCount || 0))
                .map((player) => {
                  const achievementRank = [...filteredPlayers]
                    .sort((a, b) => (b.achievementCount || 0) - (a.achievementCount || 0))
                    .findIndex(p => p.userId === player.userId) + 1 + (currentPage - 1) * playersPerPage;
                  
                  return (
                    <tr 
                      key={player.userId} 
                      className={`border-b border-surface-700 hover:bg-surface-700/50 ${
                        achievementRank === 1 ? 'bg-warning-500/5' :
                        achievementRank === 2 ? 'bg-surface-300/5' :
                        achievementRank === 3 ? 'bg-amber-600/5' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <span className={`text-xl font-bold ${
                            achievementRank === 1 ? 'text-warning-500' :
                            achievementRank === 2 ? 'text-surface-300' :
                            achievementRank === 3 ? 'text-amber-600' :
                            'text-surface-400'
                          }`}>
                            #{achievementRank}
                          </span>
                          {achievementRank <= 3 && (
                            <Trophy 
                              className={`ml-2 h-5 w-5 ${
                                achievementRank === 1 ? 'text-warning-500' : 
                                achievementRank === 2 ? 'text-surface-300' : 'text-amber-600'
                              }`} 
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ProfileImage userId={player.userId} />
                          <div>
                            <p className="font-medium text-surface-50">
                              {player.nickname || `Jugador ${player.userId}`}
                            </p>
                            <p className="text-sm text-surface-400">
                              Posición General: #{getPlayerRank(player.userId)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Award className="h-5 w-5 text-warning-500" />
                          <Badge className="bg-warning-500/20 text-warning-400 border border-warning-500/30">
                            {player.achievementCount || 0}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-surface-50">
                          {player.achievementPoints?.toLocaleString() || 0}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-surface-300">
          <Award className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
          <h3 className="text-xl font-medium text-surface-200 mb-2">No hay logros desbloqueados todavía</h3>
          <p className="max-w-md mx-auto">
            Juega regularmente para desbloquear logros y ganar puntos extra.
          </p>
        </div>
      )}
    </>
  )
}
