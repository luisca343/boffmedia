"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives/button"
import { Icon, type IconName } from "@/components/boffmedia/primitives/icon"
import { Panel } from "@/components/boffmedia/primitives/panel"
import { EventCard, eventStatus, type EventLike } from "@/components/boffmedia/ui/events"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
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
  const { events } = useGetEvents()
  const { leaderboards } = useGetLeaderboards()

  const upcoming = React.useMemo(() => {
    const list = (Array.isArray(events) ? events : []) as EventLike[]
    return list
      .filter((e) => eventStatus(e) !== "completed")
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4)
  }, [events])

  const top = React.useMemo(() => {
    const list = Array.isArray(leaderboards) ? [...leaderboards] : []
    return list.sort((a, b) => (Number(b.totalPoints) || 0) - (Number(a.totalPoints) || 0)).slice(0, 5)
  }, [leaderboards])

  return (
    <main className="wrap pb-[90px] pt-[34px]">
      <div className="mb-6">
        <span className="mono-label">{t("kicker")}</span>
        <h1 className="mt-2 text-[clamp(46px,6vw,80px)]">{t("title")}</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[17px]/[1.6] text-txt-muted">{t("lead")}</p>
      </div>

      {/* Discord CTA */}
      <div className="mb-8 flex flex-wrap items-center gap-5 border border-solid border-accent-line border-l-4 border-l-accent bg-[linear-gradient(120deg,var(--accent-soft),var(--panel)_60%)] px-7 py-6 cut-corner">
        <span className="grid h-[54px] w-[54px] flex-none place-items-center bg-accent text-accent-ink [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]">
          <Icon name="discord" size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] not-italic normal-case text-txt">{t("discord.title")}</h2>
          <p className="mt-1.5 font-body text-[15px] text-txt-muted">{t("discord.lead")}</p>
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
            className="group flex items-center gap-3 border border-solid border-line bg-panel px-4 py-3.5 no-underline cut-tag transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2"
          >
            <Icon name={l.icon} size={18} className="flex-none text-accent" />
            <span className="min-w-0 truncate font-display text-[14px] font-bold uppercase tracking-[0.03em] text-txt">
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
            <Link href="/eventos" className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent no-underline hover:text-accent-bright">
              {t("events.viewAll")}
            </Link>
          }
          bodyClassName="grid gap-3"
        >
          {upcoming.length === 0 ? (
            <p className="font-body text-[14px] text-txt-dim">{t("empty")}</p>
          ) : (
            upcoming.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </Panel>

        {/* top players */}
        <Panel
          title={t("players.title")}
          aside={
            <Link href="/clasificacion" className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-accent no-underline hover:text-accent-bright">
              {t("players.viewAll")}
            </Link>
          }
          bodyClassName="p-0"
        >
          {top.length === 0 ? (
            <p className="p-5 font-body text-[14px] text-txt-dim">{t("empty")}</p>
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
                  <span className={cn("w-6 flex-none font-display text-[20px]/none font-extrabold italic", i < 3 ? "text-accent" : "text-txt-muted")}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-[15px]/none font-bold uppercase text-txt">
                    {(p as { nickname?: string }).nickname}
                  </span>
                  <span className="flex-none font-mono text-[13px]/none font-semibold text-txt">
                    {Number((p as { totalPoints?: number }).totalPoints ?? 0).toLocaleString("es-ES")}
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
