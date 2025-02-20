import { CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Event } from "@/types/events"
import { EventCard } from "./EventCard"
import { EventEmptyState } from "./EventEmptyState"

interface EventsListProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
}

export function EventsList({ events, onEdit, onDelete }: EventsListProps) {
  if (events.length === 0) {
    return (
      <CardContent>
        <EventEmptyState />
      </CardContent>
    )
  }

  return (
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-surface-700">
              <TableHead className="text-surface-300">ID</TableHead>
              <TableHead className="text-surface-300">Evento</TableHead>
              <TableHead className="text-surface-300">Juego</TableHead>
              <TableHead className="text-surface-300">Fecha Inicio</TableHead>
              <TableHead className="text-surface-300">Fecha Fin</TableHead>
              <TableHead className="text-surface-300">Estado</TableHead>
              <TableHead className="text-surface-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <EventCard key={event.id} event={event} onEdit={() => onEdit(event)} onDelete={() => onDelete(event)} />
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

