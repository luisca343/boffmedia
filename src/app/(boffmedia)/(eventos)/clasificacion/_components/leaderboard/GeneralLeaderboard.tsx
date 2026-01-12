import { LeaderboardList } from "@/components/boffmedia/leaderboard/LeaderboardList"
import { LeaderboardEntry } from "@/generated/api"

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

  const t = useTranslations('boffmedia')

  const getRankForPlayer = (player: any) => {
    return getPlayerRank(player.userId)
  }

  const emptyStateDescription = searchTerm 
    ? t('eventsSection.leaderboard.emptyForTerm', { term: searchTerm })
    : t('eventsSection.leaderboard.emptyDescription')

  return (
    <LeaderboardList
      players={currentPlayers}
      getRank={getRankForPlayer}
      showDetailedBreakdown={true}
      useProfileImage={true}
      emptyStateTitle={t('eventsSection.leaderboard.emptyTitle')}
      emptyStateDescription={emptyStateDescription}
      searchTerm={searchTerm}
      onClearSearch={() => setSearchTerm('')}
    />
  )
}
