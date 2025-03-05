import { Trophy, Medal, Award } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProfileImage } from "@/components/ProfileImage"
import type { LeaderboardEntry } from "@/types/events"

type GeneralLeaderboardProps = {
  currentPlayers: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
  calculateTotalScore: (player: LeaderboardEntry) => number
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function GeneralLeaderboard({
  currentPlayers,
  getPlayerRank,
  calculateTotalScore,
  searchTerm,
  setSearchTerm,
}: GeneralLeaderboardProps) {
  return (
    <>
      {currentPlayers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="px-4 py-3 text-left text-surface-300 font-medium">Posición</th>
                <th className="px-4 py-3 text-left text-surface-300 font-medium">Jugador</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Puntuación Total</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Medallas</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Logros</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.map((player) => {
                const globalRank = getPlayerRank(player.userId)
                let rankColorClass = 'text-surface-400'
                let bgColorClass = ''
                
                if (globalRank === 1) {
                  rankColorClass = 'text-warning-500 font-bold'
                  bgColorClass = 'bg-warning-500/5'
                } else if (globalRank === 2) {
                  rankColorClass = 'text-surface-300 font-bold'
                  bgColorClass = 'bg-surface-300/5'
                } else if (globalRank === 3) {
                  rankColorClass = 'text-amber-600 font-bold'
                  bgColorClass = 'bg-amber-500/5'
                }
                
                const totalScore = calculateTotalScore(player)
                
                return (
                  <tr 
                    key={player.userId} 
                    className={`border-b border-surface-700 hover:bg-surface-700/50 ${bgColorClass}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <span className={`text-xl font-bold ${rankColorClass}`}>
                          #{globalRank}
                        </span>
                        {typeof globalRank === 'number' && globalRank <= 3 && (
                          <Trophy 
                            className={`ml-2 h-5 w-5 ${
                              globalRank === 1 ? 'text-warning-500' : 
                              globalRank === 2 ? 'text-surface-300' : 'text-amber-600'
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
                            {player.username || `Jugador ${player.userId}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-medium text-surface-50">
                        {totalScore.toLocaleString()}
                      </span>
                      <div className="text-xs text-surface-400">
                        <span>Medallas: {player.medalPoints || 0}</span>
                        <span className="mx-1">•</span>
                        <span>Logros: {player.achievementPoints || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Medal className="h-5 w-5 text-primary-500" />
                        <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30">
                          {player.medalCount || 0}
                        </Badge>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-surface-300">
          <Trophy className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
          <h3 className="text-xl font-medium text-surface-200 mb-2">No se encontraron jugadores</h3>
          <p className="max-w-md mx-auto">
            {searchTerm 
              ? `No hay jugadores que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.` 
              : "No hay jugadores en la clasificación todavía. Sé el primero en participar en un evento y ganar puntos."}
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              className="mt-4 border-primary-500 text-primary-500" 
              onClick={() => setSearchTerm('')}
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </>
  )
}
