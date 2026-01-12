"use client"

import { Crown, Medal, Award, User } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/primitives/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar"
import { ProfileImage } from "@/components/ui/ProfileImage"
import { LeaderboardEntry } from "@/generated/api"

interface LeaderboardCardProps {
  player: LeaderboardEntry
  rank: number | string
  totalScore?: number
  showDetailedBreakdown?: boolean
  className?: string
  useProfileImage?: boolean
  scoreType?: 'total' | 'medal' | 'achievement'
  customScoreLabel?: string
}

export function LeaderboardCard({
  player,
  rank,
  totalScore,
  showDetailedBreakdown = false,
  className = "",
  useProfileImage = true,
  scoreType = 'total',
  customScoreLabel,
}: LeaderboardCardProps) {
  const t = useTranslations('boffmedia')
  const rankIndex = typeof rank === 'number' ? rank - 1 : parseInt(rank.toString()) - 1
  const displayScore = totalScore ?? player.totalPoints

  const getRankBadgeStyles = (index: number) => {
    if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black'
    if (index === 1) return 'bg-gradient-to-br from-surface-300 to-surface-500 text-black'
    if (index === 2) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
    return 'bg-gradient-to-br from-accent-600 to-indigo-600 text-white'
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6" />
    if (index === 1) return <Medal className="w-6 h-6" />
    if (index === 2) return <Award className="w-6 h-6" />
    return rank
  }

  const getCardBorderStyle = (index: number) => {
    return index < 3 
      ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10' 
      : 'border-accent-500/20'
  }

  const getScoreDisplay = () => {
    const medalPoints = Number(player.medalPoints || 0)
    const achievementPoints = Number(player.achievementPoints || 0)

    const breakdownParts: string[] = []
    if (medalPoints > 0) breakdownParts.push(t('eventsSection.leaderboard.counts.medals', { count: medalPoints }))
    if (achievementPoints > 0) breakdownParts.push(t('eventsSection.leaderboard.counts.achievements', { count: achievementPoints }))

    const breakdown = breakdownParts.length > 0 ? breakdownParts.join(' + ') : null

    if (scoreType === 'medal') {
      return {
        score: displayScore,
        label: customScoreLabel || t('eventsSection.leaderboard.labels.medals'),
        breakdown: medalPoints > 0 ? t('eventsSection.leaderboard.counts.medals', { count: medalPoints }) : null,
        gradient: "from-blue-400 to-cyan-400"
      }
    }

    if (scoreType === 'achievement') {
      return {
        score: displayScore,
        label: customScoreLabel || t('eventsSection.leaderboard.labels.points'),
        breakdown: achievementPoints > 0 ? t('eventsSection.leaderboard.counts.achievements', { count: achievementPoints }) : null,
        gradient: "from-yellow-400 to-orange-400"
      }
    }

    return {
      score: displayScore,
      label: customScoreLabel || t('eventsSection.leaderboard.labels.points'),
      breakdown: showDetailedBreakdown ? breakdown : null,
      gradient: "from-yellow-400 to-orange-400"
    }
  }

  const scoreDisplay = getScoreDisplay()

  return (
    <Card 
      className={`bg-surface-800/60 backdrop-blur-sm transition-all hover:scale-105 ${getCardBorderStyle(rankIndex)} ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeStyles(rankIndex)}`}>
            {getRankIcon(rankIndex)}
          </div>
          
          <ProfileImage userId={player.userId} size={48} />
          
          {/* Player Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-white">
              {player.nickname || `Jugador ${player.userId}`}
            </h3>
            <p className="text-surface-400 text-sm">
              {t('eventsSection.leaderboard.counts.achievements', { count: player.achievementCount || 0 })} • {t('eventsSection.leaderboard.counts.medals', { count: player.medalCount || 0 })}
            </p>
          </div>
          
          {/* Score Display */}
          <div className="text-right">
            <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${scoreDisplay.gradient}`}>
              {scoreDisplay.score}
            </div>
            <div className="text-surface-400 text-sm">{scoreDisplay.label}</div>
            {scoreDisplay.breakdown && (
              <div className="text-xs text-surface-500 mt-1">
                {scoreDisplay.breakdown}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
