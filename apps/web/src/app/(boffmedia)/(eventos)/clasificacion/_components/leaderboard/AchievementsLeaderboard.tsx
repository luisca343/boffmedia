import { LeaderboardList } from "@/components/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@boffmedia/shared"

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
  const sortedPlayers = [...currentPlayers].sort((a, b) => (b.achievementCount || 0) - (a.achievementCount || 0))
  const getRankForPlayer = (player: any) => {
    const achievementRank = [...filteredPlayers]
      .sort((a, b) => (b.achievementCount || 0) - (a.achievementCount || 0))
      .findIndex(p => p.userId === player.userId) + 1 + (currentPage - 1) * playersPerPage
    return achievementRank
  }

  const getTotalScore = (player: any) => {
    return player.achievementCount || 0
  }

  return (
    <LeaderboardList
      players={sortedPlayers}
      getRank={getRankForPlayer}
      calculateTotalScore={getTotalScore}
      showDetailedBreakdown={false}
      useProfileImage={true}
      emptyStateTitle="No hay logros desbloqueados todavía"
      emptyStateDescription="Juega regularmente para desbloquear logros y ganar puntos extra."
      emptyStateIcon="award"
      scoreType="achievement"
    />
  )
}
