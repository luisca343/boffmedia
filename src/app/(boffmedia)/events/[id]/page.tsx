"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, Calendar, Clock, Users, MapPin, Trophy, Star, 
  Award, Target, Share2, Bookmark, ChevronRight, Zap, 
  Server, Crown, Medal, Sparkles, ExternalLink, User,
  GamepadIcon as Gamepad2
} from "lucide-react"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import { EventRegistrationButton } from "../_components/EventRegistrationButton"
import Link from "next/link"
import { Event } from "@/generated/api/models/Event"

export default function EventSummaryPage() {
  const params = useParams()
  const eventId = parseInt(params.id as string)
  const { session } = useBoffSession()
  
  const [event, setEvent] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    async function fetchEventData() {
      try {
        setIsLoading(true)
        
        const [eventResponse, participantsResponse, achievementsResponse] = await Promise.all([
          EventsService.getEvent(eventId),
          EventsService.getEventParticipants(eventId),
          EventsService.getEventAchievements(eventId)
        ])
        
        setEvent(eventResponse.data)
        setParticipants(participantsResponse.data || [])
        setAchievements(achievementsResponse.data || [])
        
        // Mock leaderboard data - replace with actual API call when available
        const mockLeaderboard = participantsResponse.data?.slice(0, 10).map((participant: any, index: number) => ({
          ...participant,
          position: index + 1,
          points: Math.floor(Math.random() * 1000) + 100,
          achievementsUnlocked: Math.floor(Math.random() * achievementsResponse.data?.length || 5)
        })) || []
        
        setLeaderboard(mockLeaderboard)
        
      } catch (error) {
        console.error("Error fetching event data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId && !isNaN(eventId)) {
      fetchEventData()
    }
  }, [eventId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventStatus = (startDate: string, endDate?: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    if (now < start) {
      return { label: 'Próximo', color: 'from-secondary-500 to-cyan-600', icon: Clock }
    } else if (end && now > end) {
      return { label: 'Finalizado', color: 'from-surface-500 to-surface-600', icon: Calendar }
    } else {
      return { label: 'En Curso', color: 'from-success-500 to-emerald-600', icon: Zap }
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case Event.type.EVENT: return Trophy
      case Event.type.SERVER: return Server
      default: return Calendar
    }
  }

  const getTimeUntilEvent = (dateString: string) => {
    const now = new Date().getTime()
    const eventTime = new Date(dateString).getTime()
    const difference = eventTime - now

    if (difference < 0) return null

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `En ${days} días`
    if (hours > 0) return `En ${hours} horas`
    return 'Muy pronto'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-accent-500/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-accent-500 rounded-full animate-spin"></div>
              <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            
            <h2 className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-pink-400">
              Cargando evento...
            </h2>
            <p className="mt-2 text-surface-400">Preparando una experiencia épica</p>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Evento no encontrado</h1>
            <Link href="/events">
              <Button className="bg-gradient-to-r from-accent-600 to-indigo-600">
                Volver a eventos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status = getEventStatus(event.startDate, event.endDate)
  const timeUntil = getTimeUntilEvent(event.startDate)
  const TypeIcon = getEventTypeIcon(event.type)
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto p-6 max-w-7xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/events">
            <Button variant="ghost" className="text-surface-300 hover:text-surface-50 hover:bg-surface-800/50 border border-transparent hover:border-accent-500/30">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a eventos
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-surface-800/80 via-accent-900/40 to-surface-800/80 backdrop-blur-sm border border-accent-500/20 rounded-3xl overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Event Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  {event.icon ? (
                    <img src={event.icon} alt="" className="w-12 h-12 rounded-xl" />
                  ) : (
                    <TypeIcon className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <Badge className={`bg-gradient-to-r ${status.color} text-white px-4 py-2 text-sm font-bold`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {status.label}
                  </Badge>
                  {timeUntil && (
                    <div className="text-secondary-400 text-sm mt-1 font-medium">{timeUntil}</div>
                  )}
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-pink-400 to-indigo-400 mb-4">
                  {event.title}
                </h1>
                <p className="text-lg text-surface-300 leading-relaxed">{event.description}</p>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-surface-300">
                  <Clock className="w-5 h-5 text-accent-400" />
                  <div>
                    <div className="text-sm text-surface-400">Inicia</div>
                    <div className="font-semibold">{formatDate(event.startDate)}</div>
                  </div>
                </div>
                {event.endDate && (
                  <div className="flex items-center gap-3 text-surface-300">
                    <Calendar className="w-5 h-5 text-accent-400" />
                    <div>
                      <div className="text-sm text-surface-400">Finaliza</div>
                      <div className="font-semibold">{formatDate(event.endDate)}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-surface-300">
                  <Users className="w-5 h-5 text-accent-400" />
                  <div>
                    <div className="text-sm text-surface-400">Participantes</div>
                    <div className="font-semibold">{participants.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-surface-300">
                  <Gamepad2 className="w-5 h-5 text-accent-400" />
                  <div>
                    <div className="text-sm text-surface-400">Juego</div>
                    <div className="font-semibold">{event.gameName || `Juego #${event.gameId}`}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <EventRegistrationButton event={event} />
                <Button variant="outline" className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
                <Button variant="outline" className="border-accent-500/30 text-accent-400 hover:bg-accent-500/10">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Event Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-accent-600/10 to-pink-600/10 rounded-2xl p-8 border border-accent-500/20 h-full flex items-center justify-center">
                {event.banner ? (
                  <img 
                    src={event.banner} 
                    alt={event.title} 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-accent-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                      <TypeIcon className="w-16 h-16 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">¡Evento Épico!</h4>
                    <p className="text-surface-300">Prepárate para la aventura</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-surface-800/40 backdrop-blur-sm border border-accent-500/20 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600">
              <Trophy className="w-4 h-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="participants" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600">
              <Users className="w-4 h-4 mr-2" />
              Participantes ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600">
              <Award className="w-4 h-4 mr-2" />
              Logros ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-600 data-[state=active]:to-indigo-600">
              <Crown className="w-4 h-4 mr-2" />
              Clasificación
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary-400" />
                    Participantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-cyan-400">
                    {participants.length}
                  </div>
                  <p className="text-surface-400 text-sm">Aventureros registrados</p>
                </CardContent>
              </Card>

              <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Logros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    {achievements.length}
                  </div>
                  <p className="text-surface-400 text-sm">Conquistas disponibles</p>
                </CardContent>
              </Card>

              <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent-400" />
                    Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-accent-400">
                    {event.type === Event.type.EVENT ? 'Evento' : 'Servidor'}
                  </div>
                  <p className="text-surface-400 text-sm">Modalidad de juego</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent-400" />
                    Explora los Logros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-surface-300 mb-4">
                    Descubre todos los logros disponibles en este evento y sigue tu progreso.
                  </p>
                  <Link href={`/events/${eventId}/achievements`}>
                    <Button className="w-full bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-700 hover:to-indigo-700">
                      Ver Logros
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    Tabla de Clasificación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-surface-300 mb-4">
                    Compite con otros jugadores y escala posiciones en la clasificación.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('leaderboard')}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                  >
                    Ver Clasificación
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {participants.map((participant, index) => (
                <Card key={participant.id} className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20 hover:scale-105 transition-transform">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-accent-500/30">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback className="bg-accent-600 text-white">
                          {participant.nickname?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {participant.nickname || 'Jugador Anónimo'}
                        </h3>
                        <p className="text-surface-400 text-sm">
                          Participante #{index + 1}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.slice(0, 6).map((achievement) => (
                <Card key={achievement.id} className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        {achievement.icon ? (
                          <img src={achievement.icon} alt="" className="w-8 h-8" />
                        ) : (
                          <Trophy className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                        <p className="text-surface-300 text-sm">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                        <Star className="w-3 h-3 mr-1" />
                        {achievement.points} pts
                      </Badge>
                      <Badge variant="outline" className="border-accent-500/30 text-accent-400">
                        {achievement.rarity || 'Común'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {achievements.length > 6 && (
              <div className="text-center">
                <Link href={`/events/${eventId}/achievements`}>
                  <Button className="bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-700 hover:to-indigo-700">
                    Ver Todos los Logros ({achievements.length})
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="space-y-4">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <Card key={entry.id} className={`bg-surface-800/60 backdrop-blur-sm transition-all hover:scale-105 ${
                  index < 3 
                    ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/10' 
                    : 'border-accent-500/20'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                        index === 1 ? 'bg-gradient-to-br from-surface-300 to-surface-500 text-black' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                        'bg-gradient-to-br from-accent-600 to-indigo-600 text-white'
                      }`}>
                        {index < 3 ? (
                          index === 0 ? <Crown className="w-6 h-6" /> :
                          index === 1 ? <Medal className="w-6 h-6" /> :
                          <Award className="w-6 h-6" />
                        ) : (
                          entry.position
                        )}
                      </div>
                      
                      <Avatar className="w-12 h-12 border-2 border-accent-500/30">
                        <AvatarImage src={entry.avatar} />
                        <AvatarFallback className="bg-accent-600 text-white">
                          {entry.nickname?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {entry.nickname || 'Jugador Anónimo'}
                        </h3>
                        <p className="text-surface-400 text-sm">
                          {entry.achievementsUnlocked} logros desbloqueados
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                          {entry.points}
                        </div>
                        <div className="text-surface-400 text-sm">puntos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}