"use client"

import { useState, useEffect } from 'react'
import { Calendar, Trophy } from "lucide-react"
import { InternalLink } from "@/components/nav/Link"
import { Button } from "@/components/ui/button"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { Event } from "@/generated/api/models/Event"
import { EventCard } from "@/components/event/EventCard"

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

  // ...existing code...

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
          <Button variant="accent">Ver todos los eventos →</Button>
        </InternalLink>
      </div>
      {events.length === 0 ? (
        <div className="bg-surface-800/60 backdrop-blur-sm border-accent-500/20 rounded-2xl py-12 text-center">
          <Trophy className="w-16 h-16 text-surface-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">No hay eventos disponibles</h3>
          <p className="text-surface-400 mb-6">
            Aún no hay eventos creados para este juego. ¡Vuelve pronto para descubrir nuevas competiciones!
          </p>
          <InternalLink href="/eventos">
            <Button variant="accent">
              Explorar todos los eventos
            </Button>
          </InternalLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.slice(0, 6).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
