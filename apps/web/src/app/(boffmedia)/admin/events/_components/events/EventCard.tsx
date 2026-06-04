import { TableCell, TableRow } from "@/components/ui/primitives/table";
import { Button } from "@/components/ui/primitives/button";
import { Pencil, Trash2, Calendar, Plus } from "lucide-react";
import type { Event } from "@boffmedia/shared";
import { getEventStatus } from "@/lib/events";
import { cn } from "@/lib/utils";
import { EventStatusChip } from "@/components/boffmedia-old/event/EventStatusChip";

// Maps the date-computed status label to Event.status for EventStatusChip
const LABEL_TO_STATUS: Record<string, Event.status> = {
  "En Curso": "active" as Event.status,
  "Próximo": "upcoming" as Event.status,
  "Finalizado": "completed" as Event.status,
};

interface EventCardProps {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  isParent?: boolean;
  isChild?: boolean;
  parentEvent?: Event;
}

export function EventCard({ event, onEdit, onDelete, isParent, isChild, parentEvent }: EventCardProps) {
  const gameDisplay = event.gameName || `Juego #${event.gameId}`;
  const status = getEventStatus(event.startDate, event.endDate);
  const chipStatus = LABEL_TO_STATUS[status.label] ?? ("completed" as Event.status);

  return (
    <TableRow
      className={cn(
        "border-surface-800 transition-colors duration-150",
        isChild
          ? "bg-surface-900/40 hover:bg-surface-900/60"
          : "hover:bg-surface-900/30",
      )}
    >
      {/* Event name + icon */}
      <TableCell>
        <div className={cn("flex items-center gap-3", isChild && "pl-7")}>
          {isChild && (
            <div
              className="absolute left-4 w-3 h-px"
              style={{ background: "rgba(249,115,22,0.25)" }}
            />
          )}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              background: "rgba(249,115,22,0.07)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
          >
            {event.icon ? (
              <img src={event.icon} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <Calendar className="w-4 h-4" style={{ color: "rgba(249,115,22,0.6)" }} />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-surface-100 block truncate text-sm">
              {event.title}
            </span>
            <span className="text-[11px] font-mono text-surface-600 truncate block">
              {isChild && parentEvent ? (
                <span style={{ color: "rgba(249,115,22,0.6)" }}>{parentEvent.title}</span>
              ) : (
                event.type
              )}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Game */}
      <TableCell>
        <span className="text-sm text-surface-300 font-mono">{gameDisplay}</span>
      </TableCell>

      {/* Start date */}
      <TableCell>
        <span className="text-xs text-surface-400 font-mono">
          {new Date(event.startDate).toLocaleString("es-ES", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      </TableCell>

      {/* End date */}
      <TableCell>
        <span className="text-xs text-surface-500 font-mono">
          {event.endDate
            ? new Date(event.endDate).toLocaleString("es-ES", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
              })
            : "—"}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <EventStatusChip status={chipStatus} />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1.5">
          {isParent && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              style={{ borderColor: "rgba(249,115,22,0.2)", color: "rgba(249,115,22,0.7)" }}
              onClick={onEdit}
              title="Crear sub-evento"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            style={{ borderColor: "rgba(249,115,22,0.2)", color: "rgba(249,115,22,0.7)" }}
            onClick={onEdit}
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            style={{ borderColor: "rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.7)" }}
            onClick={onDelete}
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
