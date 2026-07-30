"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { AdminCrud } from "../_components/ui/av-crud"
import { AvSectionHead, AvPill } from "../_components/ui/av-kit"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { EventForm } from "./forms/EventForm"
import type { Event as EventType } from "@boffmedia/shared"

function useEventsList() {
  const { events, error, isLoading, refetch } = useGetEvents()
  return { data: events as EventType[] | undefined, error, isLoading, refetch }
}

const STATUS_TONE: Record<string, "amber" | "green" | "muted"> = {
  upcoming: "amber",
  active: "green",
  completed: "muted",
}

export function EventsAdmin() {
  const t = useTranslations("admin.events")
  const statusLabel = (s: string) =>
    ({ upcoming: t("statusUpcoming"), active: t("statusActive"), completed: t("statusCompleted") })[s] ?? s
  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />
      <AdminCrud<EventType>
        useList={useEventsList}
        FormComponent={EventForm}
        onCreate={async (data: any) => {
          const { gameId, ...rest } = data
          await EventsService.createEvent({
            ...rest,
            gameId,
            icon: data.icon || "",
            banner: data.banner || "",
            endDate: data.endDate || data.startDate,
          })
        }}
        onUpdate={async (id, data: any) => {
          await EventsService.updateEvent(Number(id), data)
        }}
        onDelete={async (id) => {
          await EventsService.deleteEvent(Number(id))
        }}
        searchFields={["title", "description"]}
        entityName={{ singular: t("singular"), plural: t("plural") }}
        columns={[
          { key: "title", label: t("colEvent"), render: (e) => (
            <div className="flex items-center gap-3">
              <div className="cut-seal [--cut:7px] w-9 h-9 bg-panel-2 border border-solid border-line flex items-center justify-center overflow-hidden shrink-0">
                {e.icon ? (
                  <img src={e.icon} alt={e.title} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="calendar" size={16} className="text-txt-dim" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-medium">{e.title}</span>
                {e.parentEventName && <p className="text-xs text-txt-dim font-mono">{e.parentEventName}</p>}
              </div>
            </div>
          )},
          { key: "gameName", label: t("colGame"), render: (e) => (
            <span className="text-sm text-txt-muted">{e.gameName ?? "—"}</span>
          )},
          { key: "status", label: t("colStatus"), render: (e) => (
            <AvPill tone={STATUS_TONE[e.status] ?? "muted"}>{statusLabel(e.status)}</AvPill>
          )},
          { key: "startDate", label: t("colStart"), render: (e) => (
            <span className="text-sm text-txt-muted font-mono">{new Date(e.startDate).toLocaleDateString()}</span>
          )},
        ]}
      />
    </div>
  )
}
