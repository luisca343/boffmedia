import { LeaderboardList } from "@/features/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@boffmedia/shared"

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
  const getRankForPlayer = (player: any) => {
    const medalRank = [...filteredPlayers]
      .sort((a, b) => (b.medalCount || 0) - (a.medalCount || 0))
      .findIndex((p) => p.userId === player.userId) + 1 + (currentPage - 1) * playersPerPage
    return medalRank
  }

  const getTotalScore = (player: any) => {
    return player.medalCount || 0
  }

  return (
    <LeaderboardList
      players={sortedPlayers}
      getRank={getRankForPlayer}
      calculateTotalScore={getTotalScore}
      showDetailedBreakdown={false}
      useProfileImage={true}
      emptyStateTitle="No hay medallas ganadas todavía"
      emptyStateDescription="Participa en eventos para ganar medallas y puntos."
      emptyStateIcon="medal"
      scoreType="medal"
    />
  )
}

