"use client"

import { useTranslations } from "next-intl"
import { AdminCrud } from "../_components/ui/av-crud"
import { AvSectionHead, AvPill } from "../_components/ui/av-kit"
import { useGetTeams } from "@/hooks/events/useGetTeams"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { TeamForm } from "./forms/TeamForm"
import type { Team } from "@boffmedia/shared"

function useTeamsList() {
  const { teams, error, isLoading, refetch } = useGetTeams()
  return { data: teams as Team[] | undefined, error, isLoading, refetch }
}

const STATUS: Record<string, "green" | "rose" | "amber"> = {
  active: "green",
  disqualified: "rose",
  withdrew: "amber",
}

export function TeamsAdmin() {
  const tr = useTranslations("admin.teams")
  return (
    <div>
      <AvSectionHead title={tr("title")} desc={tr("desc")} />
      <AdminCrud<Team>
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
        onDelete={async () => {
          /* team deletion endpoint not wired — see admin roadmap */
        }}
        searchFields={["name", "tag"]}
        entityName={{ singular: tr("singular"), plural: tr("plural") }}
        columns={[
          { key: "name", label: tr("colTeam"), render: (t) => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.name}</span>
              {t.tag && (
                <span className="text-xs font-mono text-txt-dim bg-panel-2 border border-solid border-line px-1.5 py-0.5">
                  [{t.tag}]
                </span>
              )}
            </div>
          )},
          { key: "eventId", label: tr("colEventId"), render: (t) => (
            <span className="text-sm text-txt-muted font-mono">#{t.eventId}</span>
          )},
          { key: "status", label: tr("colStatus"), render: (t) => (
            <AvPill tone={STATUS[t.status ?? ""] ?? "muted"}>{t.status ?? "—"}</AvPill>
          )},
          { key: "totalScore", label: tr("colPoints"), render: (t) => (
            <span className="text-sm font-mono text-txt-muted">{t.totalScore ?? 0}</span>
          )},
        ]}
      />
    </div>
  )
}
