import { LeaderboardList } from "@/components/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@boffmedia/shared"

type GeneralLeaderboardProps = {
  currentPlayers: LeaderboardEntry[]
  getPlayerRank: (playerId: number) => number | string
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function GeneralLeaderboard({
  currentPlayers,
  getPlayerRank,
  searchTerm,
  setSearchTerm,
}: GeneralLeaderboardProps) {

  const getRankForPlayer = (player: any) => {
    return getPlayerRank(player.userId)
  }

  const emptyStateDescription = searchTerm 
    ? `No hay jugadores que coincidan con "${searchTerm}". Prueba con otros términos de búsqueda.` 
    : "No hay jugadores en la clasificación todavía. Sé el primero en participar en un evento y ganar puntos."

  return (
    <LeaderboardList
      players={currentPlayers}
      getRank={getRankForPlayer}
      showDetailedBreakdown={true}
      useProfileImage={true}
      emptyStateTitle="No se encontraron jugadores"
      emptyStateDescription={emptyStateDescription}
      searchTerm={searchTerm}
      onClearSearch={() => setSearchTerm('')}
    />
  )
}
