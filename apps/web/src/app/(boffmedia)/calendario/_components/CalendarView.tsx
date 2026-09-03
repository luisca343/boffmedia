"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Empty, Icon, Spinner, ToolHeader } from "@boffmedia/ui"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useFormat } from "@boffmedia/ui/useFormat"
import { EventStatusChip, dayMonth, eventStatus, type EventLike } from "@/components/boffmedia/ui/events"

export function CalendarView() {
  const t = useTranslations("calendario")
  const tEv = useTranslations("events")
  const { intlLocale: locale } = useFormat()
  const { events, error, isLoading, refetch } = useGetEvents()

  const groups = React.useMemo(() => {
    const list = (Array.isArray(events) ? events : []) as EventLike[]
    // Undated events have no place on a calendar — they drop out entirely.
    const sorted = [...list]
      .filter((e) => Boolean(e.startDate))
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
    const map = new Map<string, { label: string; items: EventLike[] }>()
    for (const e of sorted) {
      const d = new Date(e.startDate!)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      if (!map.has(key)) {
        map.set(key, { label: d.toLocaleDateString(locale, { month: "long", year: "numeric" }), items: [] })
      }
      map.get(key)!.items.push(e)
    }
    return [...map.values()]
  }, [events, locale])

  return (
    <main className="wrap-wide pb-[5.625rem] pt-[2.125rem]">
      <ToolHeader className="mb-8" title={t("title")} sub={t("lead")} />

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
      ) : groups.length === 0 ? (
        <Empty icon="calendar" title={t("empty.title")} lead={t("empty.lead")} />
      ) : (
        <div className="grid gap-9">
          {groups.map((g) => (
            <section key={g.label}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-[clamp(1.375rem,3vw,1.875rem)] text-txt">{g.label}</h2>
                <span aria-hidden className="h-px flex-1 bg-line" />
                <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em] text-txt-dim">
                  {tEv("count", { count: g.items.length })}
                </span>
              </div>
              <div className="grid gap-2.5">
                {g.items.map((e) => {
                  const dm = dayMonth(e.startDate, locale)
                  const status = eventStatus(e)
                  return (
                    <Link
                      key={e.id}
                      href={`/eventos/${e.id}`}
                      className={cn(
                        "group flex items-center gap-5 border border-solid border-line border-l-4 border-l-accent bg-panel px-5 py-3.5 no-underline cut-tag cut-tag-edge",
                        "transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2",
                        status === "completed" && "opacity-70",
                      )}
                    >
                      <div className="flex w-[3.375rem] flex-none flex-col items-center justify-center border-r border-line pr-4">
                        <span className="font-display text-[2rem]/none font-extrabold italic text-accent">{dm.d}</span>
                        <span className="mt-1 font-mono text-[0.5625rem]/none font-semibold uppercase tracking-[0.12em] text-txt-muted">
                          {dm.m}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[1.1875rem]/[1.05] text-txt">{e.title}</h3>
                        {e.gameName && (
                          <span className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[0.65625rem]/none font-medium uppercase tracking-[0.06em] text-txt-muted">
                            <Icon name="gamepad" size={12} className="text-txt-dim" />
                            {e.gameName}
                          </span>
                        )}
                      </div>
                      <EventStatusChip status={status} label={tEv(`status.${status}`)} className="flex-none max-[560px]:hidden" />
                      <Icon
                        name="chevronRight"
                        size={16}
                        className="flex-none text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright"
                      />
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
