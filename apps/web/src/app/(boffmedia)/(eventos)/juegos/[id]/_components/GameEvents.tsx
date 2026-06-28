"use client"

import { useState, useEffect } from 'react'
import { Calendar, Trophy } from "lucide-react"
import { InternalLink } from "@/components/ui/navigation/Link"
import { Button } from "@/components/ui/primitives/button"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { Event } from "@boffmedia/shared"
import { EventCard } from "@/components/boffmedia-old/event/EventCard"

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
          <div className="animate-spin h-8 w-8 border-2 border-secondary rounded-full border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-2">Eventos del Juego</h2>
        <div className="text-center py-8 text-ink">
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
          <p className="text-ink-muted">{events.length} eventos disponibles</p>
        </div>
        <InternalLink href={`/eventos?game=${gameId}`}>
          <Button variant="accent">Ver todos los eventos →</Button>
        </InternalLink>
      </div>
      {events.length === 0 ? (
        <div className="bg-layer-2/60 backdrop-blur-sm border-secondary/20 rounded-2xl py-12 text-center">
          <Trophy className="w-16 h-16 text-ink-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink mb-2">No hay eventos disponibles</h3>
          <p className="text-ink-muted mb-6">
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
