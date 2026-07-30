"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button, Empty, SearchInput, Seg, Spinner } from "@boffmedia/ui"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { EventCard, eventStatus, type EventLike, type EventStatus } from "@/components/boffmedia/ui/events"

const FILTERS = ["all", "active", "upcoming", "completed"] as const
type Filter = (typeof FILTERS)[number]
const ORDER: Record<EventStatus, number> = { active: 0, upcoming: 1, completed: 2 }

export function EventsView() {
  const t = useTranslations("events")
  const { events, error, isLoading, refetch } = useGetEvents()
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")

  const sorted = React.useMemo(() => {
    const list = (Array.isArray(events) ? events : []) as EventLike[]
    const needle = q.trim().toLowerCase()
    return list
      .filter((e) => {
        if (filter !== "all" && eventStatus(e) !== filter) return false
        if (needle && !`${e.title} ${e.gameName ?? ""}`.toLowerCase().includes(needle)) return false
        return true
      })
      .sort((a, b) => {
        const d = ORDER[eventStatus(a)] - ORDER[eventStatus(b)]
        return d || new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      })
  }, [events, q, filter])

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-6">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(44px,6vw,72px)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[16px]/[1.55] text-txt-muted">{t("lead")}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder={t("search")} className="max-w-[360px] flex-1 basis-[240px]" />
        <div className="max-w-full overflow-x-auto">
          <Seg
            options={FILTERS.map((f) => ({ value: f, label: t(`filter.${f}`) }))}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
            className="w-max"
          />
        </div>
        <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-txt-muted">
          {t("count", { count: sorted.length })}
        </span>
      </div>

      {isLoading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Spinner />
        </div>
      ) : error ? (
        <Empty icon="alert" title={t("error.title")}>
          <Button icon="refresh" onClick={() => refetch()}>
            {t("error.retry")}
          </Button>
        </Empty>
      ) : sorted.length === 0 ? (
        <Empty icon="calendar" title={t("empty.title")} lead={t("empty.lead")} />
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))] max-[720px]:grid-cols-1">
          {sorted.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </main>
  )
}
