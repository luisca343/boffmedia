"use client"

import { Users } from "lucide-react"
import { AdminCrud } from "@/components/boffmedia-v2/ui/admin/admin-crud"
import { useGetTeams } from "@/hooks/events/useGetTeams"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { TeamForm } from "./forms/TeamForm"
import { toast } from "react-toastify"
import type { Team } from "@boffmedia/shared"

function useTeamsList() {
  const { teams, error, isLoading, refetch } = useGetTeams()
  return { data: teams as Team[] | undefined, error, isLoading, refetch }
}

export function TeamsAdmin() {
  return (
    <AdminCrud<Team>
      title="Gestión de Equipos"
      icon={Users}
      description="Administra los equipos de los eventos"
      useList={useTeamsList}
      FormComponent={TeamForm}
      onCreate={async (data: any) => {
        const { id, ...teamData } = data
        await EventsService.createTeam(data.eventId, teamData)
      }}
      onUpdate={async (id, data: any) => {
        const { id: _id, ...teamData } = data as any
        await EventsService.updateTeam(data.eventId, Number(id), teamData)
      }}
      onDelete={async (id) => {
        toast.success(`Equipo eliminado con éxito.`)
      }}
      searchFields={["name", "tag"]}
      entityName={{ singular: "equipo", plural: "equipos" }}
      columns={[
        { key: "name", label: "Equipo", render: (t) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{t.name}</span>
            {t.tag && <span className="text-xs font-mono text-ink-dim bg-layer-2 px-1.5 py-0.5 rounded">[{t.tag}]</span>}
          </div>
        )},
        { key: "eventId", label: "Evento ID", render: (t) => (
          <span className="text-sm text-ink-muted">#{t.eventId}</span>
        )},
        { key: "status", label: "Estado", render: (t) => {
          const colors: Record<string, string> = { active: "text-emerald-400", disqualified: "text-red-400", withdrew: "text-amber-400" }
          return <span className={`text-sm ${colors[t.status ?? ""] ?? "text-ink-muted"}`}>{t.status ?? "—"}</span>
        }},
        { key: "totalScore", label: "Puntos", render: (t) => (
          <span className="text-sm font-mono text-ink-muted">{t.totalScore ?? 0}</span>
        )},
      ]}
    />
  )
}
