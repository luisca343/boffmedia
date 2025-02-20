import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Calendar } from "lucide-react"
import type { Event } from "@/types/events"

interface EventCardProps {
  event: Event
  onEdit: () => void
  onDelete: () => void
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const getEventStatus = () => {
    const now = new Date()
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)

    if (now < startDate) {
      return { label: "Próximo", class: "bg-primary-500/20 text-primary-400 border-primary-500/30" }
    } else if (now > endDate) {
      return { label: "Finalizado", class: "bg-surface-500/20 text-surface-400 border-surface-500/30" }
    } else {
      return { label: "En Curso", class: "bg-success-500/20 text-success-400 border-success-500/30" }
    }
  }

  const status = getEventStatus()

  return (
    <TableRow className="border-surface-700 hover:bg-surface-700/50">
      <TableCell className="font-medium text-surface-400">#{event.id}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-700 flex items-center justify-center overflow-hidden">
            {event.icon ? (
              <img src={`/img/${event.icon}`} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <Calendar className="h-6 w-6 text-surface-500" />
            )}
          </div>
          <div>
            <span className="font-medium text-surface-50 block">{event.title}</span>
            <span className="text-sm text-surface-400">{event.type}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-surface-50">{event.game}</span>
      </TableCell>
      <TableCell>
        <span className="text-surface-300">{new Date(event.startDate).toLocaleString()}</span>
      </TableCell>
      <TableCell>
        <span className="text-surface-300">{new Date(event.endDate).toLocaleString()}</span>
      </TableCell>
      <TableCell>
        <Badge className={status.class}>{status.label}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" className="h-8 w-8 border-surface-600" onClick={onEdit}>
            <Pencil className="h-4 w-4 text-primary-400" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 border-surface-600" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-warning-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

