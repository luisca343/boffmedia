"use client"

import { Calendar } from "lucide-react"
import { AdminCrud } from "@/components/boffmedia-v2/ui/admin/admin-crud"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { EventForm } from "./forms/EventForm"
import type { Event as EventType } from "@boffmedia/shared"

function useEventsList() {
  const { events, error, isLoading, refetch } = useGetEvents()
  return { data: events as EventType[] | undefined, error, isLoading, refetch }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Próximo", color: "text-amber-400" },
  active: { label: "Activo", color: "text-emerald-400" },
  completed: { label: "Completado", color: "text-ink-muted" },
}

export function EventsAdmin() {
  return (
    <AdminCrud<EventType>
      title="Gestión de Eventos"
      icon={Calendar}
      description="Administra los eventos del portal"
      useList={useEventsList}
      FormComponent={EventForm}
      onCreate={async (data: any) => {
        const { gameId, ...rest } = data
        const eventData = {
          ...rest,
          gameId,
          icon: data.icon || "",
          banner: data.banner || "",
          endDate: data.endDate || data.startDate,
        }
        await EventsService.createEvent(eventData)
      }}
      onUpdate={async (id, data: any) => {
        await EventsService.updateEvent(Number(id), data)
      }}
      onDelete={async (id) => {
        await EventsService.deleteEvent(Number(id))
      }}
      searchFields={["title", "description"]}
      entityName={{ singular: "evento", plural: "eventos" }}
      columns={[
        { key: "title", label: "Evento", render: (e) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-layer-2 border border-edge flex items-center justify-center overflow-hidden shrink-0">
              {e.icon ? (
                <img src={e.icon} alt={e.title} className="w-full h-full object-cover" />
              ) : (
                <Calendar className="w-4 h-4 text-ink-dim" />
              )}
            </div>
            <div>
              <span className="font-medium text-ink">{e.title}</span>
              {e.parentEventName && (
                <p className="text-xs text-ink-dim">{e.parentEventName}</p>
              )}
            </div>
          </div>
        )},
        { key: "gameName", label: "Juego", render: (e) => (
          <span className="text-sm text-ink-muted">{e.gameName ?? "—"}</span>
        )},
        { key: "status", label: "Estado", render: (e) => {
          const s = STATUS_LABELS[e.status] ?? { label: e.status, color: "text-ink-muted" }
          return <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
        }},
        { key: "startDate", label: "Inicio", render: (e) => (
          <span className="text-sm text-ink-muted">{new Date(e.startDate).toLocaleDateString()}</span>
        )},
      ]}
    />
  )
}
