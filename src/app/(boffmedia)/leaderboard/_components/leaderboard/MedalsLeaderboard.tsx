import { Trophy, Medal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  return (
    <>
      {currentPlayers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="px-4 py-3 text-left text-surface-300 font-medium">Posición</th>
                <th className="px-4 py-3 text-left text-surface-300 font-medium">Jugador</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Medallas</th>
                <th className="px-4 py-3 text-right text-surface-300 font-medium">Puntos de Medallas</th>
              </tr>
            </thead>
            <tbody>
              {[...currentPlayers]
                .sort((a, b) => (b.medalCount || 0) - (a.medalCount || 0))
                .map((player) => {
                  const medalRank =
                    [...filteredPlayers]
                      .sort((a, b) => (b.medalCount || 0) - (a.medalCount || 0))
                      .findIndex((p) => p.userId === player.userId) +
                    1 +
                    (currentPage - 1) * playersPerPage

                  return (
                    <tr
                      key={player.userId}
                      className={`border-b border-surface-700 hover:bg-surface-700/50 ${
                        medalRank === 1
                          ? "bg-warning-500/5"
                          : medalRank === 2
                            ? "bg-surface-300/5"
                            : medalRank === 3
                              ? "bg-amber-600/5"
                              : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <span
                            className={`text-xl font-bold ${
                              medalRank === 1
                                ? "text-warning-500"
                                : medalRank === 2
                                  ? "text-surface-300"
                                  : medalRank === 3
                                    ? "text-amber-600"
                                    : "text-surface-400"
                            }`}
                          >
                            #{medalRank}
                          </span>
                          {medalRank <= 3 && (
                            <Trophy
                              className={`ml-2 h-5 w-5 ${
                                medalRank === 1
                                  ? "text-warning-500"
                                  : medalRank === 2
                                    ? "text-surface-300"
                                    : "text-amber-600"
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
                          <Medal className="h-5 w-5 text-primary-500" />
                          <Badge className="bg-primary-500/20 text-primary-400 border border-primary-500/30">
                            {player.medalCount || 0}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-surface-50">{player.medalPoints?.toLocaleString() || 0}</span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-surface-300">
          <Medal className="h-16 w-16 mx-auto mb-6 text-surface-500 opacity-40" />
          <h3 className="text-xl font-medium text-surface-200 mb-2">No hay medallas ganadas todavía</h3>
          <p className="max-w-md mx-auto">Participa en eventos para ganar medallas y puntos.</p>
        </div>
      )}
    </>
  )
}

