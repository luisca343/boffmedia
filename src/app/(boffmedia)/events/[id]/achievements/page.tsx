"use client"

import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, Trophy, Award, Search, Filter, Lock, 
  Calendar, Target, Users, Star 
} from "lucide-react"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import { Achievement, Event, UserProgress, EventParticipant } from "@/types/events"
import { useBoffSession } from "@/services/useBoffSession"
import Link from "next/link"

interface AchievementWithProgress extends Achievement {
  userProgress?: UserProgress
  isUnlocked: boolean
  currentProgress: number
}

export default function EventAchievementsPage() {
  const params = useParams()
  const eventId = parseInt(params.id as string)
  const { session } = useBoffSession()
  
  // Extract userId to a stable reference
  const userId = session?.user?.id
  
  const [event, setEvent] = useState<Event | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [progressData, setProgressData] = useState<UserProgress[]>([])
  const [participantId, setParticipantId] = useState<number | null>(null)
  const [filteredAchievements, setFilteredAchievements] = useState<AchievementWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Fetch event and achievements in parallel
        const [eventResponse, achievementsResponse] = await Promise.all([
          eventsService.getEvent(eventId),
          eventsService.getEventAchievements(eventId)
        ])
        
        setEvent(eventResponse.data)
        setAchievements(achievementsResponse.data)

        // Get current user's participant ID and progress
        if (userId) {
          try {
            const participantsResponse = await eventsService.getEventParticipants(eventId)
            const participant = participantsResponse.data.find(
              (p: EventParticipant) => p.userId === parseInt(userId)
            )
            
            if (participant) {
              setParticipantId(participant.id)
              
              // Fetch user progress if participant exists
              const progressResponse = await eventsService.getParticipantProgressByEvent(
                eventId, 
                participant.id
              )
              setProgressData(progressResponse.data)
            } else {
              // Reset progress data if user is not a participant
              setParticipantId(null)
              setProgressData([])
            }
          } catch (progressError) {
            console.error("Error fetching progress:", progressError)
            setParticipantId(null)
            setProgressData([])
          }
        } else {
          // Reset progress data if no user
          setParticipantId(null)
          setProgressData([])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only run if eventId is valid
    if (eventId && !isNaN(eventId)) {
      fetchData()
    }
  }, [eventId, userId]) // Use userId instead of session?.user?.id

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

  useEffect(() => {
    let filtered = achievementsWithProgress

    // Filter by status
    if (activeFilter === "unlocked") {
      filtered = filtered.filter(a => a.isUnlocked)
    } else if (activeFilter === "locked") {
      filtered = filtered.filter(a => !a.isUnlocked)
    }

    // Filter by search term
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

  const getRarityColor = (rarity?: string | null) => {
    switch (rarity?.toLowerCase()) {
      case 'diamond': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
      case 'platinum': return 'text-purple-400 border-purple-500/30 bg-purple-500/10'
      case 'gold': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
      case 'silver': return 'text-gray-300 border-gray-400/30 bg-gray-400/10'
      case 'bronze': return 'text-amber-600 border-amber-600/30 bg-amber-600/10'
      default: return 'text-surface-400 border-surface-500/30 bg-surface-500/10'
    }
  }

  const getCategoryIcon = (category: string, itemType: string) => {
    if (itemType === "medal") {
      return <Award className="h-4 w-4" />
    }
    
    switch (category) {
      case 'competition': return <Trophy className="h-4 w-4" />
      case 'challenge': return <Target className="h-4 w-4" />
      case 'participation': return <Users className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-700 rounded w-1/3"></div>
          <div className="h-32 bg-surface-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-surface-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" className="mb-4 text-surface-300 hover:text-surface-50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al evento
          </Button>
        </Link>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-surface-700 flex items-center justify-center">
            {event?.icon ? (
              <img src={event.icon} alt="" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Trophy className="h-8 w-8 text-amber-500" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-surface-50">Logros</h1>
            <p className="text-surface-300">{event?.title}</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-surface-800/50 border border-surface-700 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-50">{unlockedCount}</div>
              <div className="text-sm text-surface-400">Desbloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-50">{totalCount}</div>
              <div className="text-sm text-surface-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-50">{earnedPoints}</div>
              <div className="text-sm text-surface-400">Puntos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-50">{completionRate.toFixed(1)}%</div>
              <div className="text-sm text-surface-400">Completado</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={completionRate} className="h-3" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            placeholder="Buscar logros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos ({totalCount})</TabsTrigger>
            <TabsTrigger value="unlocked">Desbloqueados ({unlockedCount})</TabsTrigger>
            <TabsTrigger value="locked">Bloqueados ({totalCount - unlockedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div 
            key={achievement.id} 
            className={`bg-surface-800/50 border rounded-lg p-6 transition-all hover:bg-surface-800/70 ${
              achievement.isUnlocked 
                ? 'border-surface-600' 
                : 'border-surface-700 opacity-75'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                achievement.isUnlocked 
                  ? 'bg-amber-500/20' 
                  : 'bg-surface-700'
              }`}>
                {achievement.isUnlocked ? (
                  achievement.icon ? (
                    <img src={achievement.icon} alt="" className="w-12 h-12" />
                  ) : (
                    getCategoryIcon(achievement.category, achievement.itemType)
                  )
                ) : (
                  <Lock className="h-8 w-8 text-surface-500" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${
                    achievement.isUnlocked ? 'text-surface-50' : 'text-surface-400'
                  }`}>
                    {achievement.name}
                  </h3>
                  {achievement.rarity && (
                    <Badge className={getRarityColor(achievement.rarity)}>
                      {achievement.rarity}
                    </Badge>
                  )}
                </div>
                
                <p className={`text-sm ${
                  achievement.isUnlocked ? 'text-surface-300' : 'text-surface-500'
                }`}>
                  {achievement.description}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {achievement.itemType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {achievement.category}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-surface-300">{achievement.points}</span>
                </div>
                
                {achievement.maxProgress > 1 && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-primary-500" />
                    <span className="text-sm text-surface-300">
                      {achievement.currentProgress}/{achievement.maxProgress}
                    </span>
                  </div>
                )}
              </div>
              
              {achievement.isUnlocked && achievement.userProgress?.completedAt && (
                <div className="text-xs text-surface-400">
                  {formatDate(achievement.userProgress.completedAt)}
                </div>
              )}
            </div>

            {achievement.maxProgress > 1 && (
              <div className="mt-3">
                <Progress 
                  value={(achievement.currentProgress / achievement.maxProgress) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-surface-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-surface-50 mb-2">No se encontraron logros</h3>
          <p className="text-surface-400">
            {searchTerm 
              ? "Intenta con términos de búsqueda diferentes" 
              : "No hay logros disponibles para este filtro"}
          </p>
        </div>
      )}
    </div>
  )
}