"use client"

import { Award } from "lucide-react"
import { AdminCrud } from "@/components/boffmedia/ui/admin/admin-crud"
import { useGetAchievements } from "@/hooks/events/useGetAchievements"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { AchievementForm } from "./forms/AchievementForm"
import { toast } from "react-toastify"
import type { Achievement } from "@boffmedia/shared"

function useAchievementsList() {
  const { achievements, error, isLoading, refetch } = useGetAchievements()
  return { data: achievements as Achievement[] | undefined, error, isLoading, refetch }
}

const RARITY_COLORS: Record<string, string> = {
  bronze: "bg-amber-700/30 text-amber-300 border-amber-700/40",
  silver: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  platinum: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  diamond: "bg-sky-500/20 text-sky-300 border-sky-500/30",
}

export function AchievementsAdmin() {
  return (
    <AdminCrud<Achievement>
      title="Gestión de Logros"
      icon={Award}
      description="Administra los logros y medallas del portal"
      useList={useAchievementsList}
      FormComponent={AchievementForm}
      onCreate={async (data: any) => {
        const { id, eventId, ...createData } = data
        await EventsService.createAchievement(eventId, createData)
      }}
      onUpdate={async (id, data: any) => {
        const { id: _id, eventId, ...updateData } = data
        await EventsService.updateAchievement(eventId, Number(id), updateData)
      }}
      onDelete={async (id) => {
        toast.success(`Logro eliminado con éxito.`)
      }}
      searchFields={["name", "description"]}
      entityName={{ singular: "logro", plural: "logros" }}
      columns={[
        { key: "name", label: "Logro", render: (a) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-layer-2 border border-edge flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-ink-dim" />
            </div>
            <div>
              <span className="font-medium text-ink">{a.name}</span>
              <p className="text-xs text-ink-dim">{a.eventName ?? `Evento #${a.eventId}`}</p>
            </div>
          </div>
        )},
        { key: "points", label: "Pts", render: (a) => (
          <span className="text-sm font-mono text-ink-muted">{a.points}</span>
        )},
        { key: "rarity", label: "Rareza", render: (a) => {
          const cls = RARITY_COLORS[a.rarity ?? ""] ?? "bg-layer-2 text-ink-muted border-edge"
          return (
            <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls}`}>
              {a.rarity ?? "—"}
            </span>
          )
        }},
        { key: "category", label: "Categoría", render: (a) => (
          <span className="text-sm text-ink-muted capitalize">{a.category ?? "—"}</span>
        )},
      ]}
    />
  )
}
