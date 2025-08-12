import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Calendar, ChevronRight, Plus } from "lucide-react"
import type { Event } from "@/types/events"
import { useGetGames } from "@/hooks/events/useGetGames"
import { cn } from "@/lib/utils"
import { getEventStatus } from "@/lib/events" // Import the new utility function

interface EventCardProps {
  event: Event
  onEdit: () => void
  onDelete: () => void
  isParent?: boolean
  isChild?: boolean
  parentEvent?: Event
}

export function EventCard({ event, onEdit, onDelete, isParent, isChild, parentEvent }: EventCardProps) {
  const { games } = useGetGames()

  // Find the game name
  const gameDisplay = event.gameName || `Juego #${event.gameId}`

  // Use the utility function
  const status = getEventStatus(event.startDate, event.endDate)

  return (
    <TableRow className={cn("border-surface-700 hover:bg-surface-700/50", isChild && "bg-surface-800/50")}>
      <TableCell>
        <div
          className={cn(
            "flex items-center gap-3",
            isChild && "pl-6", // Indent child events
          )}
        >
          <div className="w-10 h-10 rounded bg-surface-700 flex items-center justify-center overflow-hidden">
            {event.icon ? (
              <img
                src={event.icon ? `${event.icon}` : "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Calendar className="h-6 w-6 text-surface-500" />
            )}
          </div>
          <div>
            <span className="font-medium text-surface-50 block">{event.title}</span>
            <span className="text-sm text-surface-400">
              {isChild && parentEvent ? (
                <span className="text-primary-400">{parentEvent.title}</span>
              ) : (
                event.type
              )}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-surface-50">{gameDisplay}</span>
      </TableCell>
      <TableCell>
        <span className="text-surface-300">{new Date(event.startDate).toLocaleString()}</span>
      </TableCell>
      <TableCell>
        <span className="text-surface-300">{event.endDate ? new Date(event.endDate).toLocaleString() : "Sin fecha"}</span>
      </TableCell>
      <TableCell>
        <Badge className={status.class}>{status.label}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          {isParent && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-surface-600"
              onClick={onEdit}
              title="Crear sub-evento"
            >
              <Plus className="h-4 w-4 text-primary-400" />
            </Button>
          )}
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

