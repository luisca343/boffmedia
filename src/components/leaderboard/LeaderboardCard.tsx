"use client"

import { Crown, Medal, Award, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileImage } from "@/components/ProfileImage"
import type { BaseLeaderboardEntry } from "./types"

interface LeaderboardCardProps {
  player: BaseLeaderboardEntry
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
    if (scoreType === 'medal') {
      return {
        score: displayScore,
        label: customScoreLabel || "medallas",
        breakdown: `${player.medalPoints || 0} puntos`,
        gradient: "from-blue-400 to-cyan-400"
      }
    }
    if (scoreType === 'achievement') {
      return {
        score: displayScore,
        label: customScoreLabel || "logros",
        breakdown: `${player.achievementPoints || 0} puntos`,
        gradient: "from-yellow-400 to-orange-400"
      }
    }
    return {
      score: displayScore,
      label: customScoreLabel || "puntos",
      breakdown: showDetailedBreakdown ? `${player.medalPoints || 0} medallas + ${player.achievementPoints || 0} logros` : null,
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
          
          {/* Player Avatar */}
          {useProfileImage ? (
            <ProfileImage userId={player.userId} />
          ) : (
            <Avatar className="w-12 h-12 border-2 border-accent-500/30">
              <AvatarImage src={player.avatar} />
              <AvatarFallback className="bg-accent-600 text-white">
                {player.nickname?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
          )}
          
          {/* Player Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-white">
              {player.nickname || `Jugador ${player.userId}`}
            </h3>
            <p className="text-surface-400 text-sm">
              {player.achievementCount || 0} logros • {player.medalCount || 0} medallas
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
