"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon, Panel, ToolHeader, type IconName } from "@boffmedia/ui"
import { EventCard, eventStatus, type EventLike } from "@/components/boffmedia/ui/events"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { useFormat } from "@boffmedia/ui/useFormat"
import { DISCORD } from "@/components/boffmedia/ui/landing/landing-data"

const LINKS: { href: string; icon: IconName; key: "events" | "ranking" | "achievements" | "calendar" }[] = [
  { href: "/eventos", icon: "trophy", key: "events" },
  { href: "/clasificacion", icon: "chart", key: "ranking" },
  { href: "/logros", icon: "star", key: "achievements" },
  { href: "/calendario", icon: "calendar", key: "calendar" },
]

export function CommunityView() {
  const t = useTranslations("community")
  const tCal = useTranslations("calendario")
  const { number: formatNumber } = useFormat()
  const { events } = useGetEvents()
  const { leaderboards } = useGetLeaderboards()

  const upcoming = React.useMemo(() => {
    const list = (Array.isArray(events) ? events : []) as EventLike[]
    return list
      .filter((e) => eventStatus(e) !== "completed")
      // Undated events sort last — Infinity, not the epoch `new Date(null)` gives.
      .sort(
        (a, b) =>
          (a.startDate ? new Date(a.startDate).getTime() : Infinity) -
          (b.startDate ? new Date(b.startDate).getTime() : Infinity)
      )
      .slice(0, 4)
  }, [events])

  const top = React.useMemo(() => {
    const list = Array.isArray(leaderboards) ? [...leaderboards] : []
    return list.sort((a, b) => (Number(b.totalPoints) || 0) - (Number(a.totalPoints) || 0)).slice(0, 5)
  }, [leaderboards])

  return (
    <main className="wrap-wide pb-[5.625rem] pt-[2.125rem]">
      <ToolHeader className="mb-6" title={t("title")} sub={t("lead")} />

      {/* Discord CTA */}
      <div className="mb-8 flex flex-wrap items-center gap-5 border border-solid border-accent-line border-l-4 border-l-accent bg-[linear-gradient(120deg,var(--accent-soft),var(--panel)_60%)] px-7 py-6 cut-corner cut-corner-edge [--cut-line:var(--accent-line)]">
        <span className="grid h-[3.375rem] w-[3.375rem] flex-none place-items-center bg-accent text-accent-ink [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]">
          <Icon name="discord" size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.375rem] not-italic normal-case text-txt">{t("discord.title")}</h2>
          <p className="mt-1.5 font-body text-[0.9375rem] text-txt-muted">{t("discord.lead")}</p>
        </div>
        <Button variant="pri" icon="discord" href={DISCORD} className="flex-none">
          {t("discord.cta")}
        </Button>
      </div>

      {/* quick links */}
      <div className="mb-8 grid grid-cols-4 gap-3 max-[720px]:grid-cols-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center gap-3 border border-solid border-line bg-panel px-4 py-3.5 no-underline cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-line:var(--line)] transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2"
          >
            <Icon name={l.icon} size={18} className="flex-none text-accent" />
            <span className="min-w-0 truncate font-display text-[0.875rem] font-bold uppercase tracking-[0.03em] text-txt">
              {t(`links.${l.key}`)}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-5 [grid-template-columns:1.4fr_1fr] max-[900px]:grid-cols-1">
        {/* upcoming events */}
        <Panel
          title={t("events.title")}
          aside={
            <Link href="/eventos" className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-accent no-underline hover:text-accent-bright">
              {t("events.viewAll")}
            </Link>
          }
          bodyClassName="grid gap-3"
        >
          {upcoming.length === 0 ? (
            <p className="font-body text-[0.875rem] text-txt-dim">{t("empty")}</p>
          ) : (
            upcoming.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </Panel>

        {/* top players */}
        <Panel
          title={t("players.title")}
          aside={
            <Link href="/clasificacion" className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-accent no-underline hover:text-accent-bright">
              {t("players.viewAll")}
            </Link>
          }
          bodyClassName="p-0"
        >
          {top.length === 0 ? (
            <p className="p-5 font-body text-[0.875rem] text-txt-dim">{t("empty")}</p>
          ) : (
            <div className="grid">
              {top.map((p, i) => (
                <div
                  key={(p as { participantId?: number }).participantId ?? i}
                  className={cn(
                    "flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0",
                    i < 3 && "bg-[linear-gradient(90deg,var(--accent-soft),transparent_60%)]",
                  )}
                >
                  <span className={cn("w-6 flex-none font-display text-[1.25rem]/none font-extrabold italic", i < 3 ? "text-accent" : "text-txt-muted")}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-[0.9375rem]/none font-bold uppercase text-txt">
                    {(p as { nickname?: string }).nickname}
                  </span>
                  <span className="flex-none font-mono text-[0.8125rem]/none font-semibold text-txt">
                    {formatNumber(Number((p as { totalPoints?: number }).totalPoints ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </main>
  )
}
