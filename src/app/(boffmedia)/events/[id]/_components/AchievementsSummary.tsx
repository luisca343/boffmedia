"use client"

import { useState, useEffect, useMemo } from "react"
import { Award, Users, Trophy, Target, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { Achievement, UserProgress, EventParticipant } from "@/types/events"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"

interface AchievementWithProgress extends Achievement {
  userProgress?: UserProgress
  isUnlocked: boolean
  currentProgress: number
}

interface AchievementsSummaryProps {
  eventId: number
}

export function AchievementsSummary({ eventId }: any) {
  const { session } = useBoffSession()
  const [achievements, setAchievements] = useState<any[]>([])
  const [progressData, setProgressData] = useState<any[]>([])
  const [participantId, setParticipantId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Fetch achievements
        const achievementsResponse = await EventsService.getEventAchievements(eventId)
        setAchievements(achievementsResponse.data!)

        // Get current user's participant ID
        if (session?.user?.id) {
          try {
            const participantsResponse = await EventsService.getEventParticipants(eventId)
            const participant = participantsResponse.data!.find(
              (p: any) => p.userId === parseInt(session.user.id!)
            )
            
            if (participant) {
              setParticipantId(participant.id)
              
              // Fetch user progress if participant exists
              const progressResponse = await EventsService.getParticipantProgressByEvent(
                eventId, 
                participant.id
              )
              setProgressData(progressResponse.data!)
            }
          } catch (progressError) {
            console.error("Error fetching progress:", progressError)
            setProgressData([])
          }
        }
      } catch (error) {
        console.error("Error fetching achievements:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId) {
      fetchData()
    }
  }, [eventId, session?.user?.id])

  // Merge achievements with progress data
  const achievementsWithProgress: AchievementWithProgress[] = useMemo(() => {
    return achievements.map(achievement => {
      const progress = progressData.find(p => p.achievementId === achievement.id)
      return {
        ...achievement,
        userProgress: progress,
        isUnlocked: progress?.isCompleted === 1 || false,
        currentProgress: progress?.currentProgress || 0,
      }
    })
  }, [achievements, progressData])

  const unlockedAchievements = achievementsWithProgress.filter(a => a.isUnlocked)
  const totalAchievements = achievementsWithProgress.length
  const completionRate = totalAchievements > 0 ? (unlockedAchievements.length / totalAchievements) * 100 : 0

  // Get recent achievements (last 3 unlocked, sorted by completedAt)
  const recentAchievements = useMemo(() => {
    return unlockedAchievements
      .filter(a => a.userProgress?.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.userProgress!.completedAt!).getTime()
        const dateB = new Date(b.userProgress!.completedAt!).getTime()
        return dateB - dateA
      })
      .slice(0, 3)
  }, [unlockedAchievements])

  if (isLoading) {
    return (
      <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-surface-700 rounded"></div>
            <div className="h-4 bg-surface-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (totalAchievements === 0) {
    return null
  }

  const getRarityColor = (rarity?: string | null) => {
    switch (rarity?.toLowerCase()) {
      case 'diamond': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
      case 'platinum': return 'text-accent-400 border-accent-500/30 bg-accent-500/10'
      case 'gold': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      case 'silver': return 'text-surface-300 border-surface-400/30 bg-surface-400/10'
      case 'bronze': return 'text-amber-600 border-amber-600/30 bg-amber-600/10'
      default: return 'text-surface-400 border-surface-500/30 bg-surface-500/10'
    }
  }

  return (
    <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-surface-50 flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-amber-500" />
          Logros
        </h3>
        <Link href={`/events/${eventId}/achievements`}>
          <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300">
            Ver todos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-surface-300">Progreso</span>
          <span className="text-surface-50 font-semibold">
            {unlockedAchievements.length} / {totalAchievements}
          </span>
        </div>
        <Progress value={completionRate} className="h-2 mb-2" />
        <div className="text-sm text-surface-400">
          {completionRate.toFixed(1)}% completado
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div>
          <h4 className="text-surface-50 font-medium mb-3 flex items-center">
            <Award className="mr-2 h-4 w-4 text-primary-500" />
            Logros Recientes
          </h4>
          <div className="space-y-3">
            {recentAchievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center p-3 bg-surface-700/30 rounded-lg border border-surface-600/50">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mr-3">
                  {achievement.icon ? (
                    <img src={achievement.icon} alt="" className="w-8 h-8" />
                  ) : (
                    <Trophy className="h-6 w-6 text-amber-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-surface-50 font-medium">{achievement.name}</h5>
                    {achievement.rarity && (
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-surface-300 line-clamp-1">{achievement.description}</p>
                </div>
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  {achievement.points} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-surface-700 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-surface-50">{unlockedAchievements.length}</div>
          <div className="text-sm text-surface-400">Desbloqueados</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-surface-50">
            {unlockedAchievements.reduce((sum, a) => sum + a.points, 0)}
          </div>
          <div className="text-sm text-surface-400">Puntos</div>
        </div>
      </div>
    </div>
  )
}