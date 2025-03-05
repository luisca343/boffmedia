"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Plus, Loader2, ArrowLeft } from "lucide-react"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import type { CreateEventDto } from "@/types/dto/create-event.dto"
import type { Event, Game } from "@/types/events"
import Link from "next/link"
import { format } from "date-fns"
import { useBoffSession } from "@/services/useBoffSession"

export default function GameEvents({ params }: { params: { gameId: string } }) {
  const { gameId } = params
  const gameIdNumber = Number(gameId)
  const [events, setEvents] = useState<Event[]>([])
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState<CreateEventDto>({
    title: "",
    description: "",
    gameId: gameIdNumber,
    icon: "",
    startDate: "",
    endDate: "",
    type: "event",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { isBoffAdmin } = useBoffSession()

  // Use a memoized fetch function to prevent recreating on every render
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // First fetch just the game data
      const gameData = await eventsService.getGame(gameIdNumber)
      if (!gameData.data) {
        throw new Error("Game not found")
      }
      setGame(gameData.data)
      
      // Then fetch events for this specific game
      const eventsData = await eventsService.getEvents()
      if (eventsData.data) {
        // Filter events on the client side
        const filteredEvents = eventsData.data.filter((event) => event.game === gameIdNumber)
        setEvents(filteredEvents)
      }
    } catch (err) {
      setError("Error fetching data: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [gameIdNumber]) // Only depends on gameId

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData]) // fetchData is memoized, so this won't cause loops

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const result = await eventsService.createEvent(newEvent)
      if (result.data) {
        // Just add the new event to the existing events array
        setEvents(prevEvents => [...prevEvents, result.data!])
      }
      
      // Reset form
      setNewEvent({
        title: "",
        description: "",
        icon: "",
        gameId: gameIdNumber,
        startDate: "",
        endDate: "",
        type: "event",
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating event:", error)
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-error-500 mb-4">{error}</div>
        <Button onClick={fetchData} className="bg-primary-500 hover:bg-primary-600 text-white">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/games" className="flex items-center text-primary-500 hover:text-primary-600 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Juegos
          </Link>
          <h1 className="text-3xl font-bold text-surface-50">Eventos de {game?.title}</h1>
        </div>
        {isBoffAdmin() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                <Plus className="mr-2 h-4 w-4" /> Añadir Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-surface-800 text-surface-50">
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Evento</DialogTitle>
                <DialogDescription>
                  Introduce los detalles del nuevo evento aquí. Haz clic en guardar cuando hayas terminado.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                {/* Form fields remain the same */}
                <Input
                  placeholder="Título del evento"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Textarea
                  placeholder="Descripción del evento"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Input
                  type="datetime-local"
                  placeholder="Fecha de inicio"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Input
                  type="datetime-local"
                  placeholder="Fecha de fin"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as "event" | "server" })}
                  className="w-full bg-surface-700 text-surface-50 border-surface-600 rounded-md"
                >
                  <option value="event">Evento</option>
                  <option value="server">Servidor</option>
                </select>
                <Input
                  placeholder="URL del icono (obligatorio)"
                  value={newEvent.icon}
                  onChange={(e) => setNewEvent({ ...newEvent, icon: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                  required
                />
                <Input
                  placeholder="URL del banner (opcional)"
                  value={newEvent.banner}
                  onChange={(e) => setNewEvent({ ...newEvent, banner: e.target.value })}
                  className="bg-surface-700 text-surface-50 border-surface-600"
                />
                <Button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <Card key={event.id} className="bg-surface-800 border-surface-700">
              {event.banner && (
                <img
                  src={event.banner || "/placeholder.svg"}
                  alt={event.title}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
              )}
              <CardHeader className="flex flex-row items-center space-x-4">
                <img src={`/img/${event.icon}` || "/placeholder.svg"} alt={event.title} className="w-12 rounded-full" />
                <div>
                  <CardTitle className="text-surface-50">{event.title}</CardTitle>
                  <CardDescription className="text-surface-400">{event.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <p className="text-surface-300">
                    <Calendar className="inline-block mr-2 h-4 w-4" />
                    Inicio: {format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}
                  </p>
                  <p className="text-surface-300">
                    <Calendar className="inline-block mr-2 h-4 w-4" />
                    Fin: {format(new Date(event.endDate), "dd/MM/yyyy HH:mm")}
                  </p>
                  <p className="text-surface-300">Tipo: {event.type === "event" ? "Evento" : "Servidor"}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-surface-400">
            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No hay eventos para este juego todavía</p>
          </div>
        )}
      </div>
    </div>
  )
}