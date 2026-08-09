"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Icon, Spinner } from "@boffmedia/ui"
import { AdminCrud } from "../_components/ui/av-crud"
import { AvPanel, AvSectionHead, AvPill } from "../_components/ui/av-kit"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { RandomizerService } from "@/services/api/boffmedia/randomizerService"
import { EventForm } from "./forms/EventForm"
import { EventAdminPanel } from "./events/EventAdminPanel"
import type { Event as EventType } from "@boffmedia/shared"
import type { RandomizerConfig } from "@/services/api/boffmedia/randomizer.types"

function useEventsList() {
  const { events, error, isLoading, refetch } = useGetEvents()
  return { data: events as EventType[] | undefined, error, isLoading, refetch }
}

// One listConfigs() indexes the whole table's randomizer column by eventId.
function useRandomizerSummaries() {
  const [summaries, setSummaries] = useState<Map<number, RandomizerConfig> | null>(null)
  const reload = useCallback(async () => {
    try {
      const res = await RandomizerService.listConfigs()
      const configs = res.success ? res.data || [] : []
      setSummaries(new Map(configs.map((c) => [c.eventId, c])))
    } catch {
      // Column degrades to "—"; the per-event panel still works.
      setSummaries(new Map())
    }
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return { summaries, reload }
}

const STATUS_TONE: Record<string, "amber" | "green" | "muted"> = {
  upcoming: "amber",
  active: "green",
  completed: "muted",
}

const RANDOMIZER_TONE: Record<RandomizerConfig["status"], "amber" | "green" | "default" | "accent"> = {
  draft: "amber",
  open: "green",
  closed: "default",
  published: "accent",
}

const RANDOMIZER_STATUS_KEY: Record<RandomizerConfig["status"], string> = {
  draft: "statusDraft",
  open: "statusOpen",
  closed: "statusClosed",
  published: "statusPublished",
}

export function EventsAdmin() {
  const t = useTranslations("admin.events")
  const tr = useTranslations("randomizer.eventPanel")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { events, isLoading } = useGetEvents()
  const { summaries, reload } = useRandomizerSummaries()

  const randomizerParam = searchParams.get("randomizer")
  const selectedEvent = randomizerParam
    ? (events as EventType[]).find((e) => String(e.id) === randomizerParam)
    : undefined

  const openRandomizer = (e: EventType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("randomizer", String(e.id))
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const closeRandomizer = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("randomizer")
    router.replace(`?${params.toString()}`, { scroll: false })
    // The panel's lifecycle actions may have changed the badge.
    reload()
  }

  const statusLabel = (s: string) =>
    ({ upcoming: t("statusUpcoming"), active: t("statusActive"), completed: t("statusCompleted") })[s] ?? s

  if (randomizerParam && isLoading) {
    return (
      <AvPanel>
        <div className="flex items-center justify-center py-8 gap-2">
          <Spinner />
        </div>
      </AvPanel>
    )
  }

  if (selectedEvent) {
    return <EventAdminPanel event={selectedEvent} onBack={closeRandomizer} />
  }

  return (
    <div>
      <AvSectionHead title={t("title")} desc={t("desc")} />
      <AdminCrud<EventType>
        useList={useEventsList}
        FormComponent={EventForm}
        onCreate={async (data: any) => {
          const { gameId, packId, ...rest } = data
          await EventsService.createEvent({
            ...rest,
            gameId,
            // The Select yields "" for "no pack"; the column is nullable.
            packId: packId || null,
            icon: data.icon || "",
            banner: data.banner || "",
            endDate: data.endDate || data.startDate,
          })
        }}
        onUpdate={async (id, data: any) => {
          const { packId, ...rest } = data
          await EventsService.updateEvent(Number(id), { ...rest, packId: packId || null })
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
          { key: "randomizer", label: tr("colRandomizer"), render: (e) => {
            const cfg = summaries?.get(Number(e.id))
            return (
              <div className="flex items-center gap-2">
                {cfg ? (
                  <AvPill tone={cfg.launcherResolvable === false ? "amber" : RANDOMIZER_TONE[cfg.status]}>
                    {tr(RANDOMIZER_STATUS_KEY[cfg.status])}
                  </AvPill>
                ) : (
                  <span className="text-txt-dim text-sm">—</span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon="settings"
                  title={tr("openPanel")}
                  onClick={() => openRandomizer(e)}
                />
              </div>
            )
          }},
          { key: "startDate", label: t("colStart"), render: (e) => (
            <span className="text-sm text-txt-muted font-mono">{new Date(e.startDate).toLocaleDateString()}</span>
          )},
        ]}
      />
    </div>
  )
}
