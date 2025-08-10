"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, ExternalLink, Sparkles, Users, Lock, CheckCircle, Clock, Medal, Award } from "lucide-react"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"
import { InternalLink } from "@/components/nav/Link"

interface AchievementWithProgress {
  id: number
  name: string
  description: string
  icon?: string
  points: number
  rarity?: string
  maxProgress?: number
  itemType: "achievement" | "medal"
  userProgress?: {
    currentProgress: number
    isCompleted: number
    completedAt?: string
  }
  isUnlocked: boolean
  currentProgress: number
  completionRate: number
}

interface AchievementsSectionProps {
  eventId: number
  achievements: any[]
  participants: any[]
}

export function AchievementsSection({ eventId, achievements, participants }: AchievementsSectionProps) {
  const { session } = useBoffSession()
  const [progressData, setProgressData] = useState<any[]>([])
  const [participantId, setParticipantId] = useState<number | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  useEffect(() => {
    async function fetchUserProgress() {
        console.log("Fetching user progress...");
        console.log("User ID:", session?.user?.id);
        console.log("Achievements:", achievements);
      if (!session?.user?.id || achievements.length === 0) return
      
      try {
        setIsLoadingProgress(true)
        
        // Get current user's participant ID
        const participantsResponse = await EventsService.getEventParticipants(eventId)
        console.log("Participants:", participantsResponse.data);
        const participant = participantsResponse.data?.find(
          (p: any) => p.userId === parseInt(session.user.id!)
        )
        
        if (participant) {
          setParticipantId(participant.id)

          // Fetch user progress
          const progressResponse = await EventsService.getParticipantProgressByEvent(
            eventId, 
            participant.participantId
          )

          setProgressData(progressResponse.data || [])
        }
      } catch (error) {
        console.error("Error fetching user progress:", error)
        setProgressData([])
      } finally {
        setIsLoadingProgress(false)
      }
    }

    fetchUserProgress()
  }, [eventId, session?.user?.id, achievements.length])

  // Merge achievements with progress data
  const achievementsWithProgress: AchievementWithProgress[] = useMemo(() => {
    return achievements.map(achievement => {
      const progress = progressData.find(p => p.achievementId === achievement.id)
      
      console.log(progressData)

      const currentProgress = progress?.currentProgress || 0
      const maxProgress = achievement.maxProgress || 1

      console.log("Achievement:", achievement)
      console.log("Progress:", progress)

      const isUnlocked = progress?.isCompleted === 1
      
      return {
        ...achievement,
        userProgress: progress,
        isUnlocked,
        currentProgress,
        completionRate: maxProgress > 0 ? (currentProgress / maxProgress) * 100 : 0
      }
    })
  }, [achievements, progressData])

  // Separate achievements and medals
  const actualAchievements = achievementsWithProgress.filter(item => item.itemType === 'achievement')
  const medals = achievementsWithProgress.filter(item => item.itemType === 'medal')

  console.log("Actual achievements:", actualAchievements)
  console.log("Medals:", medals)

  // For achievements: show like now (with locked/unlocked states)
  const unlockedAchievements = actualAchievements.filter(a => a.isUnlocked)
  const totalAchievements = actualAchievements.length
  const playerCompletionRate = totalAchievements > 0 ? (unlockedAchievements.length / totalAchievements) * 100 : 0

  // For medals: only show the ones the player has gotten
  const playerMedals = medals.filter(m => m.isUnlocked)

  // Don't show sections if there's nothing to display
  const showAchievements = totalAchievements > 0
  const showMedals = playerMedals.length > 0

  // Get recent achievements (last 5 unlocked, sorted by completedAt)
  const recentPlayerAchievements = useMemo(() => {
    return unlockedAchievements
      .filter(a => a.userProgress?.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.userProgress!.completedAt!).getTime()
        const dateB = new Date(b.userProgress!.completedAt!).getTime()
        return dateB - dateA
      })
  }, [unlockedAchievements])

  // Get all unlocked achievements for display (prioritize those with completion dates)
  const displayUnlockedAchievements = useMemo(() => {
    const withDates = unlockedAchievements.filter(a => a.userProgress?.completedAt)
    const withoutDates = unlockedAchievements.filter(a => !a.userProgress?.completedAt)
    
    // Sort achievements with dates by completion time (most recent first)
    const sortedWithDates = withDates.sort((a, b) => {
      const dateA = new Date(a.userProgress!.completedAt!).getTime()
      const dateB = new Date(b.userProgress!.completedAt!).getTime()
      return dateB - dateA
    })
    
    // Combine: achievements with dates first, then those without
    return [...sortedWithDates, ...withoutDates]
  }, [unlockedAchievements])

  // Get recent medals (sorted by completedAt)
  const displayPlayerMedals = useMemo(() => {
    const withDates = playerMedals.filter(m => m.userProgress?.completedAt)
    const withoutDates = playerMedals.filter(m => !m.userProgress?.completedAt)
    
    // Sort medals with dates by completion time (most recent first)
    const sortedWithDates = withDates.sort((a, b) => {
      const dateA = new Date(a.userProgress!.completedAt!).getTime()
      const dateB = new Date(b.userProgress!.completedAt!).getTime()
      return dateB - dateA
    })
    
    // Combine: medals with dates first, then those without
    return [...sortedWithDates, ...withoutDates]
  }, [playerMedals])

  // Get in progress achievements (only for achievements, not medals)
  const inProgressAchievements = useMemo(() => {
    return actualAchievements
      .filter(a => !a.isUnlocked && a.currentProgress > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3)
  }, [actualAchievements])

  console.log('ShowAchievements:', showAchievements)
  console.log('ShowMedals:', showMedals)
  if (!showAchievements && !showMedals) {
    return (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-accent-400" />
            </div>
            <h3 className="text-xl font-semibold text-surface-300 mb-2">Sin logros disponibles</h3>
            <p className="text-surface-400">Los logros aparecerán pronto</p>
          </div>
    )
  }

  const getRarityColor = (rarity?: string | null) => {
    switch (rarity?.toLowerCase()) {
      case 'diamond': return 'text-cyan-300 border-cyan-400/50 bg-cyan-500/20'
      case 'platinum': return 'text-purple-200 border-purple-300/50 bg-purple-400/20'
      case 'gold': return 'text-yellow-300 border-yellow-400/50 bg-yellow-500/20'
      case 'silver': return 'text-slate-200 border-slate-300/50 bg-slate-400/20'
      case 'bronze': return 'text-orange-300 border-orange-400/50 bg-orange-600/20'
      default: return 'text-surface-300 border-surface-400/50 bg-surface-500/20'
    }
  }

  const getRarityGradient = (rarity?: string | null) => {
    switch (rarity?.toLowerCase()) {
      case 'diamond': return 'bg-gradient-to-br from-cyan-400 to-cyan-600'
      case 'platinum': return 'bg-gradient-to-br from-purple-400 to-purple-600'
      case 'gold': return 'bg-gradient-to-br from-yellow-400 to-yellow-600'
      case 'silver': return 'bg-gradient-to-br from-slate-300 to-slate-500'
      case 'bronze': return 'bg-gradient-to-br from-orange-400 to-orange-600'
      default: return 'bg-gradient-to-br from-accent-500 to-accent-600'
    }
  }
  
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${diffInHours} horas`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Achievements Section */}
      {showAchievements && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Logros</h2>
          
          {/* Steam-style Achievement Overview */}
          <div className="bg-surface-800/60 border border-surface-600/30 rounded-lg p-6">
            {/* Progress Bar */}
            {session?.user && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-white">
                    Has desbloqueado {unlockedAchievements.length}/{totalAchievements} ({playerCompletionRate.toFixed(0)}%)
                  </h3>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-accent-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${playerCompletionRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Latest Achievement - Separate Section */}
            {session?.user && displayUnlockedAchievements.length > 0 && (
              <div className="mb-6 pb-6 border-b border-surface-600/30">
                <h4 className="text-white font-medium mb-3">Último logro</h4>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center shadow-lg ${getRarityGradient(displayUnlockedAchievements[0].rarity)}`}>
                    {displayUnlockedAchievements[0].icon ? (
                      <img src={displayUnlockedAchievements[0].icon} alt="" className="w-10 h-10" />
                    ) : (
                      <Trophy className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-bold mb-1">{displayUnlockedAchievements[0].name}</h5>
                    <p className="text-surface-300 text-sm mb-2">{displayUnlockedAchievements[0].description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary-500/30 text-primary-400 text-xs">
                        {displayUnlockedAchievements[0].points} pts
                      </Badge>
                      {displayUnlockedAchievements[0].rarity && (
                        <Badge variant="outline" className={`text-xs ${getRarityColor(displayUnlockedAchievements[0].rarity)}`}>
                          {displayUnlockedAchievements[0].rarity}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement Grids Container - Side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Obtained Achievements - Left Column */}
              {session?.user && displayUnlockedAchievements.length > 1 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Logros obtenidos</h4>
                  <div className="flex flex-wrap gap-2">
                    {displayUnlockedAchievements.slice(1, 8).map((achievement) => (
                      <div
                        key={`recent-${achievement.id}`}
                        className="group relative"
                      >
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110 ${getRarityGradient(achievement.rarity)}`}>
                          {achievement.icon ? (
                            <img src={achievement.icon} alt="" className="w-10 h-10" />
                          ) : (
                            <Trophy className="w-8 h-8 text-white" />
                          )}
                        </div>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-surface-900 border border-surface-600 rounded-lg p-3 shadow-xl min-w-[200px]">
                            <h5 className="text-white font-bold text-sm mb-1">{achievement.name}</h5>
                            <p className="text-surface-300 text-xs mb-2">{achievement.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-primary-500/30 text-primary-400 text-xs">
                                {achievement.points} pts
                              </Badge>
                              {achievement.rarity && (
                                <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                                  {achievement.rarity}
                                </Badge>
                              )}
                            </div>
                            {achievement.userProgress?.completedAt && (
                              <p className="text-success-400 text-xs mt-2">
                                Desbloqueado {formatTimeAgo(achievement.userProgress.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* +X Button for additional unlocked achievements */}
                    {unlockedAchievements.length > 8 && (
                      <div className="w-16 h-16 rounded-lg bg-surface-700/30 border-2 border-dashed border-surface-600/50 flex items-center justify-center text-surface-300 font-bold cursor-pointer transition-all hover:scale-110 hover:bg-surface-700/50 hover:border-surface-500/50">
                        +{Math.max(0, unlockedAchievements.length - 8)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Locked Achievements - Right Column */}
              <div>
                <h4 className="text-surface-300 font-medium mb-3">Logros bloqueados</h4>
                <div className="flex flex-wrap gap-2">
                  {actualAchievements
                    .filter(a => !a.isUnlocked)
                    .slice(0, 7)
                    .map((achievement) => (
                      <div
                        key={`locked-${achievement.id}`}
                        className="group relative"
                      >
                        <div className="w-16 h-16 rounded-lg bg-surface-700/50 flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110 hover:bg-surface-700">
                          {achievement.icon ? (
                            <img src={achievement.icon} alt="" className="w-10 h-10 opacity-30 grayscale" />
                          ) : (
                            <Trophy className="w-8 h-8 text-surface-500" />
                          )}
                          <div className="absolute inset-0 bg-surface-900/20 rounded-lg flex items-center justify-center">
                            <Lock className="w-5 h-5 text-surface-500" />
                          </div>
                        </div>
                        
                        {/* Hover Tooltip for Locked */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-surface-900 border border-surface-600 rounded-lg p-3 shadow-xl min-w-[200px]">
                            <h5 className="text-surface-400 font-bold text-sm mb-1">{achievement.name}</h5>
                            <p className="text-surface-500 text-xs mb-2">Descripción oculta</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-surface-600/30 text-surface-500 text-xs">
                                {achievement.points} pts
                              </Badge>
                              {achievement.rarity && (
                                <Badge variant="outline" className="border-surface-600/30 text-surface-500 text-xs">
                                  {achievement.rarity}
                                </Badge>
                              )}
                            </div>
                            {achievement.currentProgress > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-surface-400">Progreso</span>
                                  <span className="text-accent-400">{achievement.currentProgress}/{achievement.maxProgress || 1}</span>
                                </div>
                                <div className="w-full bg-surface-700 rounded-full h-1">
                                  <div 
                                    className="bg-accent-500 h-1 rounded-full"
                                    style={{ width: `${achievement.completionRate}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* +X Button for additional locked achievements */}
                    {actualAchievements.filter(a => !a.isUnlocked).length > 7 && (
                      <div className="w-16 h-16 rounded-lg bg-surface-700/30 border-2 border-dashed border-surface-600/50 flex items-center justify-center text-surface-500 font-bold cursor-pointer transition-all hover:scale-110 hover:bg-surface-700/50 hover:border-surface-500/50">
                        +{Math.max(0, actualAchievements.filter(a => !a.isUnlocked).length - 7)}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* View All Achievements Button */}
            <div className="text-center pt-4 border-t border-surface-600/30">
              <InternalLink href={`/${eventId}/logros`}>
                <Button variant="ghost" className="text-accent-400 hover:text-accent-300 hover:bg-accent-500/10">
                  Ver mis logros
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </InternalLink>
            </div>
          </div>
        </div>
      )}

      {/* Medals Section */}
      {showMedals && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Medallas</h2>
          
          {/* Simple Medal Display */}
          <div className="bg-surface-800/60 border border-surface-600/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                {playerMedals.length} medalla{playerMedals.length !== 1 ? 's' : ''} obtenida{playerMedals.length !== 1 ? 's' : ''}
              </h3>
            </div>

            {/* Simple Medal List */}
            <div className="space-y-3">
              {displayPlayerMedals.map((medal) => (
                <div
                  key={`medal-${medal.id}`}
                  className="flex items-center p-3 bg-surface-700/30 rounded-lg border border-surface-600/50"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${getRarityGradient(medal.rarity)}`}>
                    {medal.icon ? (
                      <img src={medal.icon} alt="" className="w-6 h-6" />
                    ) : (
                      <Medal className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white font-medium text-sm">{medal.name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary-400 text-xs">{medal.points} pts</span>
                      {medal.rarity && (
                        <span className="text-surface-400 text-xs">• {medal.rarity}</span>
                      )}
                      {medal.userProgress?.completedAt && (
                        <span className="text-success-400 text-xs">• {formatTimeAgo(medal.userProgress.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
