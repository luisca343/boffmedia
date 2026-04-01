"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/primitives/button"
import { Badge } from "@/components/ui/primitives/badge"
import { Progress } from "@/components/ui/primitives/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs"
import { Input } from "@/components/ui/primitives/input"
import { 
  ArrowLeft, Trophy, Award, Search, Filter, Lock, 
  Calendar, Target, Users, Star, Crown, Gem, Medal,
  Sparkles, Clock, ChevronRight, Zap
} from "lucide-react"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { Event } from "@boffmedia/shared"
import { UserProgress, EventParticipant } from "@/types/events"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"
import { InternalLink } from "@/components/ui/navigation/Link"

type AchievementWithProgress = {
  id: number
  name: string
  description?: string
  icon?: string | null
  points: number
  rarity?: string | null
  hidden?: boolean
  maxProgress?: number
  category?: string
  itemType?: "achievement" | "medal"
  userProgress?: UserProgress
  isUnlocked: boolean
  currentProgress: number
  [key: string]: any
}

export default function EventAchievementsPage() {
  const params = useParams()
  const eventId = parseInt(params.id as string)
  const { session } = useBoffSession()
  
  const userId = session?.user?.id
  
  const [event, setEvent] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [progressData, setProgressData] = useState<any[]>([])
  const [participantId, setParticipantId] = useState<number | null>(null)
  const [filteredAchievements, setFilteredAchievements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        const [eventResponse, achievementsResponse] = await Promise.all([
          EventsService.getEvent(eventId),
          EventsService.getEventAchievements(eventId)
        ])
        
        setEvent(eventResponse.data)
        setAchievements(achievementsResponse.data || [])

        if (userId) {
          try {
            const participantsResponse = await EventsService.getEventParticipants(eventId) as any
            const participant = participantsResponse.data.find(
              (p: any) => p.userId === parseInt(userId)
            )
            
            if (participant) {
              setParticipantId(participant.id)
              
              const progressResponse = await EventsService.getParticipantProgressByEvent(
                eventId, 
                participant.id
              )
              setProgressData(progressResponse.data || [])
            } else {
              setParticipantId(null)
              setProgressData([])
            }
          } catch (progressError) {
            console.error("Error fetching progress:", progressError)
            setParticipantId(null)
            setProgressData([])
          }
        } else {
          setParticipantId(null)
          setProgressData([])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId && !isNaN(eventId)) {
      fetchData()
    }
  }, [eventId, userId])

  const achievementsWithProgress: AchievementWithProgress[] = useMemo(() => {
    return achievements
      .filter((achievement: any) => achievement.itemType === 'achievement') // Only show achievements, not medals
      .map((achievement: any) => {
        const progress = progressData.find(p => p.achievementId === achievement.id)
        return {
          ...achievement,
          userProgress: progress,
          isUnlocked: progress?.isCompleted === 1 || false,
          currentProgress: progress?.currentProgress || 0,
        }
      })
  }, [achievements, progressData])

  useEffect(() => {
    let filtered = achievementsWithProgress

    if (activeFilter === "unlocked") {
      filtered = filtered.filter(a => a.isUnlocked)
    } else if (activeFilter === "locked") {
      filtered = filtered.filter(a => !a.isUnlocked)
    }

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredAchievements(filtered)
  }, [achievementsWithProgress, activeFilter, searchTerm])

  const unlockedCount = achievementsWithProgress.filter(a => a.isUnlocked).length
  const totalCount = achievementsWithProgress.length
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0
  const earnedPoints = achievementsWithProgress.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0)

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "No desbloqueado"
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRarityInfo = (rarity?: string | null) => {
    switch (rarity?.toLowerCase()) {
      case 'diamond': 
        return { 
          color: 'from-cyan-400 to-secondary-500',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          icon: <Gem className="w-4 h-4" />
        }
      case 'platinum': 
        return { 
          color: 'from-accent-400 to-pink-500',
          bg: 'bg-accent-500/10',
          border: 'border-accent-500/30',
          icon: <Crown className="w-4 h-4" />
        }
      case 'gold': 
        return { 
          color: 'from-yellow-400 to-orange-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: <Trophy className="w-4 h-4" />
        }
      case 'silver': 
        return { 
          color: 'from-surface-300 to-surface-500',
          bg: 'bg-surface-400/10',
          border: 'border-surface-400/30',
          icon: <Medal className="w-4 h-4" />
        }
      case 'bronze': 
        return { 
          color: 'from-amber-600 to-amber-800',
          bg: 'bg-amber-600/10',
          border: 'border-amber-600/30',
          icon: <Award className="w-4 h-4" />
        }
      default: 
        return { 
          color: 'from-surface-400 to-surface-600',
          bg: 'bg-surface-500/10',
          border: 'border-surface-500/30',
          icon: <Star className="w-4 h-4" />
        }
    }
  }

  const getCategoryIcon = (category: string, itemType: string) => {
    if (itemType === "medal") {
      return <Award className="h-5 w-5" />
    }
    
    switch (category) {
      case 'competition': return <Trophy className="h-5 w-5" />
      case 'challenge': return <Target className="h-5 w-5" />
      case 'participation': return <Users className="h-5 w-5" />
      default: return <Star className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-accent-500/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-accent-500 rounded-full animate-spin"></div>
              <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <h2 className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-pink-400">
              Cargando logros...
            </h2>
            <p className="mt-2 text-surface-400">Preparando tus logros</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <InternalLink href={`${eventId}`}>
            <Button variant="ghost" className="mb-6 text-surface-300 hover:text-surface-50 hover:bg-surface-800/50 border border-transparent hover:border-accent-500/30">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al evento
            </Button>
          </InternalLink>
          
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-surface-800/80 via-accent-900/40 to-surface-800/80 backdrop-blur-sm border border-accent-500/20 rounded-3xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-600 to-indigo-600 flex items-center justify-center shadow-2xl">
                  {event?.icon ? (
                    <img src={event.icon} alt="" className="w-16 h-16 object-cover rounded-xl" />
                  ) : (
                    <Trophy className="h-10 w-10 text-white" />
                  )}
                </div>
                {/* Floating sparkles */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-pink-400 to-indigo-400 mb-2">
                  Logros del evento
                </h1>
                <p className="text-xl text-surface-300 mb-4">{event?.title}</p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge className="bg-gradient-to-r from-accent-500/20 to-indigo-500/20 text-accent-400 border border-accent-500/30">
                    <Trophy className="w-3 h-3 mr-1" />
                    {totalCount} logros disponibles
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-secondary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400">
                {unlockedCount}
              </div>
              <div className="text-sm text-surface-400">Desbloqueados</div>
            </div>
            
            <div className="bg-surface-800/60 backdrop-blur-sm border border-secondary-500/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-cyan-400">
                {totalCount}
              </div>
              <div className="text-sm text-surface-400">Total</div>
            </div>
            
            <div className="bg-surface-800/60 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                {earnedPoints}
              </div>
              <div className="text-sm text-surface-400">Puntos</div>
            </div>
            
            <div className="bg-surface-800/60 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-indigo-400">
                {completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-surface-400">Completado</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-surface-800/40 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-white">Progreso General</span>
              <span className="text-accent-400 font-bold">{unlockedCount}/{totalCount}</span>
            </div>
            <Progress 
              value={completionRate} 
              className="h-4 bg-surface-700"
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface-800/40 backdrop-blur-sm border border-accent-500/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-surface-400" />
              <Input
                placeholder="Buscar logros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-surface-700/50 border-surface-600 text-white placeholder-surface-400 text-lg focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
              />
            </div>
            
            <div className="flex bg-surface-700/50 rounded-xl p-1 border border-surface-600">
              <Button
                variant={activeFilter === 'all' ? "accent" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                Todos ({totalCount})
              </Button>
              <Button
                variant={activeFilter === 'unlocked' ? "success" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter('unlocked')}
              >
                Desbloqueados ({unlockedCount})
              </Button>
              <Button
                variant={activeFilter === 'locked' ? "error" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter('locked')}
              >
                Bloqueados ({totalCount - unlockedCount})
              </Button>
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement, index) => {
            const rarityInfo = getRarityInfo(achievement.rarity)
            
            return (
              <div 
                key={achievement.id}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
                className={`group bg-surface-800/60 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl opacity-0 ${
                  achievement.isUnlocked 
                    ? 'border-accent-500/30 hover:border-accent-400/50 hover:shadow-accent-500/20' 
                    : 'border-surface-700/50 opacity-75 hover:border-surface-600'
                }`}
              >
                {/* Achievement Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    achievement.isUnlocked 
                      ? `bg-gradient-to-br ${rarityInfo.color} shadow-lg` 
                      : 'bg-surface-700 group-hover:bg-surface-600'
                  }`}>
                    {achievement.isUnlocked ? (
                      achievement.icon ? (
                        <img src={achievement.icon} alt="" className="w-12 h-12 rounded-lg" />
                      ) : (
                        getCategoryIcon(achievement.category, achievement.itemType)
                      )
                    ) : (
                      <Lock className="h-6 w-6 text-surface-500" />
                    )}
                    
                    {/* Sparkle effect for unlocked achievements */}
                    {achievement.isUnlocked && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-bold text-lg truncate ${
                        achievement.isUnlocked ? 'text-white' : 'text-surface-400'
                      }`}>
                        {achievement.name}
                      </h3>
                      {achievement.rarity && (
                        <Badge className={`${rarityInfo.bg} ${rarityInfo.border} text-xs`}>
                          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${rarityInfo.color}`}>
                            {achievement.rarity}
                          </span>
                        </Badge>
                      )}
                    </div>
                    
                    {achievement.hidden ? (
                      <p className="text-sm leading-relaxed text-surface-500">Descripción oculta</p>
                    ) : (
                      <p className={`text-sm leading-relaxed ${
                        achievement.isUnlocked ? 'text-surface-300' : 'text-surface-500'
                      }`}>
                        {achievement.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Achievement Meta */}
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-xs border-accent-500/30 text-accent-400">
                    {achievement.itemType}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-secondary-500/30 text-secondary-400">
                    {achievement.category}
                  </Badge>
                </div>

                {/* Progress Section */}
                {achievement.maxProgress > 1 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-surface-400">Progreso</span>
                      <span className="text-sm font-semibold text-accent-400">
                        {achievement.currentProgress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <Progress 
                      value={(achievement.currentProgress / achievement.maxProgress) * 100} 
                      className="h-2 bg-surface-700"
                    />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-surface-700/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-400">{achievement.points}</span>
                    </div>
                  </div>
                  
                  {achievement.isUnlocked && achievement.userProgress?.completedAt && (
                    <div className="flex items-center gap-1 text-xs text-surface-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(achievement.userProgress.completedAt)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-20">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-accent-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center border border-accent-500/20">
                <Trophy className="h-12 w-12 text-accent-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-surface-500 to-surface-600 rounded-full flex items-center justify-center">
                <Search className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-pink-400 mb-4">
              No se encontraron logros
            </h3>
            <p className="text-surface-400 max-w-md mx-auto">
              {searchTerm 
                ? "Intenta con términos de búsqueda diferentes o cambia los filtros." 
                : "No hay logros disponibles para este filtro."}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}