"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { AdminCrud } from "../_components/ui/av-crud"
import { AvSectionHead, AvPill } from "../_components/ui/av-kit"
import { useGetTeams } from "@/hooks/events/useGetTeams"
import { useGetEvents } from "@/hooks/events/useGetEvents"
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
  const { events } = useGetEvents()
  const eventMap = useMemo(() => {
    const map: Record<number, string> = {}
    events?.forEach((e) => {
      map[e.id] = e.title
    })
    return map
  }, [events])

  return (
    <div>
      <AvSectionHead title={tr("title")} desc={tr("desc")} />
      <AdminCrud<Team>
        useList={useTeamsList}
        FormComponent={TeamForm}
        onCreate={async (data: any) => {
          // eventId travels in the URL — the DTO forbids it in the body.
          const { id, eventId, ...teamData } = data
          await EventsService.createTeam(eventId, teamData)
        }}
        onUpdate={async (id, data: any) => {
          const { id: _id, eventId, ...teamData } = data as any
          await EventsService.updateTeam(eventId, Number(id), teamData)
        }}
        searchFields={["name", "tag"]}
        entityName={{ singular: tr("singular"), plural: tr("plural") }}
        columns={[
          { key: "name", label: tr("colTeam"), render: (t) => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{t.name}</span>
              {t.tag && <AvPill tone="default">{t.tag}</AvPill>}
            </div>
          )},
          { key: "eventId", label: tr("colEventId"), render: (t) => (
            <span className="text-sm text-txt-muted font-mono">{eventMap[t.eventId] || `#${t.eventId}`}</span>
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
