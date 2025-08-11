"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, Users, Clock, Zap } from "lucide-react"
import { InternalLink } from "@/components/nav/Link"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { Event } from "@/generated/api"

interface GameEventsProps {
  gameId: number
}

export function GameEvents({ gameId }: GameEventsProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGameEvents() {
      try {
        setIsLoading(true)
        const response = await EventsService.getEvents()
        const gameEvents = response.data?.filter((event: Event) => event.gameId === gameId) || []
        setEvents(gameEvents)
      } catch (err: any) {
        setError(err.message || 'Error al cargar eventos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGameEvents()
  }, [gameId])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-2">Eventos del Juego</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-accent-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-2">Eventos del Juego</h2>
        <div className="text-center py-8 text-surface-300">
          <p>Error al cargar eventos: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Eventos del Juego</h2>
          <p className="text-surface-400">{events.length} eventos disponibles</p>
        </div>
        
        <InternalLink href={`/eventos?game=${gameId}`}>
          <Badge className="bg-gradient-to-r from-accent-500/20 to-secondary-500/20 text-accent-400 border border-accent-500/30 hover:bg-accent-500/30 transition-colors cursor-pointer">
            Ver todos los eventos →
          </Badge>
        </InternalLink>
      </div>

      {events.length === 0 ? (
        <Card className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20">
          <CardContent className="py-12 text-center">
            <Trophy className="w-16 h-16 text-surface-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-surface-300 mb-2">No hay eventos disponibles</h3>
            <p className="text-surface-400 mb-6">
              Aún no hay eventos creados para este juego. ¡Vuelve pronto para descubrir nuevas competiciones!
            </p>
            <InternalLink href="/eventos">
              <Badge className="bg-gradient-to-r from-accent-500 to-secondary-500 text-white px-4 py-2 hover:from-accent-600 hover:to-secondary-600 transition-colors cursor-pointer">
                Explorar todos los eventos
              </Badge>
            </InternalLink>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.slice(0, 6).map((event) => {
            const status = getEventStatus(event.startDate, event.endDate)
            const StatusIcon = status.icon

            return (
              <Card key={event.id} className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20 hover:scale-105 transition-transform">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-white mb-2">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-surface-300 line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </div>
                    <Badge className={`bg-gradient-to-r ${status.color} text-white ml-2 flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-surface-400">
                      <Calendar className="w-4 h-4" />
                      <span>Inicio: {formatDate(event.startDate)}</span>
                    </div>
                    {event.endDate && (
                      <div className="flex items-center gap-2 text-sm text-surface-400">
                        <Clock className="w-4 h-4" />
                        <span>Fin: {formatDate(event.endDate)}</span>
                      </div>
                    )}
                  </div>

                  <InternalLink href={`/eventos/${event.id}`}>
                    <Badge className="w-full justify-center bg-gradient-to-r from-accent-500/20 to-secondary-500/20 text-accent-400 border border-accent-500/30 hover:bg-accent-500/30 transition-colors cursor-pointer py-2">
                      Ver Evento →
                    </Badge>
                  </InternalLink>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
