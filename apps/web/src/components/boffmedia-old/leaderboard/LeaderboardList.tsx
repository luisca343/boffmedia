"use client"

import { LeaderboardEntry } from "@boffmedia/shared"
import { LeaderboardCard } from "./LeaderboardCard"
import { LeaderboardEmptyState } from "./LeaderboardEmptyState"

interface LeaderboardListProps {
  players: LeaderboardEntry[]
  getRank?: (player: LeaderboardEntry, index: number) => number | string
  calculateTotalScore?: (player: LeaderboardEntry) => number
  showDetailedBreakdown?: boolean
  useProfileImage?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: 'trophy' | 'medal' | 'award'
  searchTerm?: string
  onClearSearch?: () => void
  className?: string
  maxItems?: number
  scoreType?: 'total' | 'medal' | 'achievement'
  customScoreLabel?: string
}

export function LeaderboardList({
  players,
  getRank,
  calculateTotalScore,
  showDetailedBreakdown = false,
  useProfileImage = true,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateIcon = 'trophy',
  searchTerm,
  onClearSearch,
  className = "",
  maxItems,
  scoreType = 'total',
  customScoreLabel,
}: LeaderboardListProps) {
  if (players.length === 0) {
    return (
      <LeaderboardEmptyState
        title={emptyStateTitle}
        description={emptyStateDescription}
        searchTerm={searchTerm}
        onClearSearch={onClearSearch}
        icon={emptyStateIcon}
        className={className}
      />
    )
  }

  const displayPlayers = maxItems ? players.slice(0, maxItems) : players

  return (
    <div className={`space-y-4 ${className}`}>
      {displayPlayers.map((player, index) => {
        const rank = getRank ? getRank(player, index) : index + 1
        const totalScore = calculateTotalScore ? calculateTotalScore(player) : player.totalPoints

        return (
          <LeaderboardCard
            key={player.userId}
            player={player}
            rank={rank}
            totalScore={totalScore}
            showDetailedBreakdown={showDetailedBreakdown}
            useProfileImage={useProfileImage}
            scoreType={scoreType}
            customScoreLabel={customScoreLabel}
          />
        )
      })}
    </div>
  )
}
