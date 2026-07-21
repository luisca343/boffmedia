"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, CountUp } from "@/components/boffmedia/primitives"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_ROW, GLARE, HUD_FRAME, PRI_GLOW, TvCountdown } from "../landing-shared"
import { TV3_EVENT } from "../landing-data"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import type { EventLike } from "@/components/boffmedia/ui/events"

export function TvTorneos() {
  const t = useTranslations("boffmedia.landing.torneos")
  const { events } = useGetEvents()
  // Real next upcoming event feeds the header + countdown; falls back to the
  // editorial placeholder while events load or if none are scheduled.
  const next = React.useMemo(() => {
    const list = (Array.isArray(events) ? events : []) as EventLike[]
    const now = Date.now()
    return (
      list
        .filter((e) => {
          const s = new Date(e.startDate).getTime()
          return !Number.isNaN(s) && s >= now
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] || null
    )
  }, [events])

  const title = next?.title ?? TV3_EVENT.title
  const eventTs = next ? new Date(next.startDate).getTime() : undefined
  const dateStr = next
    ? `${new Date(next.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "").toUpperCase()} · ${new Date(next.startDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
    : TV3_EVENT.date

  return (
    <TvCP
      id="tv-cp3"
      n="03"
      side="l"
      kick={<Decode text={t("kick")} />}
      title={t("title")}
      lead={t("lead")}
    >
      <div
        data-glare
        className={cn(
          "relative overflow-hidden border border-solid border-line-2 bg-base-deep text-[#f2f4f8] cut-corner [--cut-lg:14px]",
          GLARE,
          HUD_FRAME,
        )}
      >
        <div className="flex items-center justify-between gap-3.5 border-b border-solid border-line px-[18px] py-3.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[#9aa3b2]">
          <span className="inline-flex items-center gap-[7px] text-[#ff4d5e]">
            <i className="h-1.5 w-1.5 rounded-full bg-[#ff4d5e] animate-[lv4-blink_1.3s_infinite] motion-reduce:animate-none" />
            {t("finalLabel")}
          </span>
          <span className="min-w-0 truncate">{title}</span>
        </div>
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-[30px] max-[520px]:grid-cols-1 max-[520px]:gap-5">
          <div className="grid justify-items-center gap-1.5 text-center">
            <span className="grid h-[50px] w-[50px] place-items-center bg-accent font-display text-[22px] font-extrabold not-italic leading-none text-accent-ink shadow-[0_0_22px_rgba(255,92,10,0.45)] cut-tag [--cut-tag:10px]">
              V
            </span>
            <b className="font-display text-[16px] font-bold uppercase leading-none">{t("team1Name")}</b>
            <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#5f6774]">{t("team1Seed")}</small>
          </div>
          <div className="grid justify-items-center gap-1.5">
            <span className="font-display text-[44px] font-extrabold leading-none tabular-nums [text-shadow:0_0_26px_rgba(255,92,10,0.35)]">
              <b className="text-accent">
                <CountUp value="2" />
              </b>
              –<CountUp value="1" />
            </span>
            <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#9aa3b2]">{t("mapInGame")}</small>
          </div>
          <div className="grid justify-items-center gap-1.5 text-center">
            <span className="grid h-[50px] w-[50px] place-items-center bg-signal font-display text-[22px] font-extrabold not-italic leading-none text-accent-ink shadow-[0_0_22px_rgba(77,163,255,0.45)] cut-tag [--cut-tag:10px]">
              A
            </span>
            <b className="font-display text-[16px] font-bold uppercase leading-none">{t("team2Name")}</b>
            <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#5f6774]">{t("team2Seed")}</small>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line px-5 py-4">
          <span className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#5f6774]">
            {t("nextBroadcast")} {dateStr}
          </span>
          <TvCountdown compact to={eventTs} />
        </div>
      </div>
      <div className={CTA_ROW}>
        <Button variant="pri" iconRight="arrow" href="/torneos" className={PRI_GLOW}>
          {t("ctaTournaments")}
        </Button>
        <Button href="/clasificacion">{t("ctaRanking")}</Button>
      </div>
    </TvCP>
  )
}
