"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Chip } from "@boffmedia/ui"
import { TvCP } from "../TvCP"
import { CTA_ROW, GLARE, HUD_FRAME, HudSweep, PRI_GLOW } from "../landing-shared"
import { DISCORD, TV3_STATS_FLOOR } from "../landing-data"
import { useSiteActivity, useSiteStats } from "@/hooks/community/useCommunity"
import { useFormat } from "@boffmedia/ui/useFormat"

export function TvComunidad() {
  const t = useTranslations("boffmedia.landing.comunidad")
  const { number: formatNumber } = useFormat()
  const { activity } = useSiteActivity(6)
  const { stats } = useSiteStats()
  // Real activity only. The four editorial lines that used to stand in here
  // named people who never did those things ("AxelCraft ganó un combate
  // ranked"), which is worse than an empty ticker — so an empty feed now says
  // so instead of inventing one.
  const feed = activity.slice(0, 4).map((a) =>
    a.type === "achievement"
      ? { k: "win", t: t("feedAchievement", { actor: a.actor, name: a.name }), ln: "border-l-ok", tp: "bg-ok" }
      : { k: "join", t: t("feedJoin", { actor: a.actor, name: a.name }), ln: "border-l-signal", tp: "bg-signal" },
  )

  // Real competitor count feeds the lead; drops the clause while stats load so
  // no number is fabricated — and below TV3_STATS_FLOOR too, where a true count
  // undersells the site more than the count-free sentence does.
  const lead =
    stats && stats.participants >= TV3_STATS_FLOOR.participants
      ? t("leadWithParticipants", { count: formatNumber(stats.participants) })
      : t("leadNoParticipants")

  return (
    <TvCP
      id="tv-cp5"
      n="05"
      side="l"
      title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
      lead={lead}
    >
      <div
        data-glare
        className={cn(
          "relative border border-solid border-line px-6 pb-6 pt-[1.375rem] backdrop-blur-[6px] [background:rgba(10,12,16,0.5)] cut-bl cut-edge-bl [--cut-e:16px] [[data-theme=light]_&]:[background:rgba(255,255,255,0.55)]",
          GLARE,
          HUD_FRAME,
        )}
      >
        <HudSweep />
        <div className="mb-[1.125rem] grid gap-2" aria-hidden="true">
          {feed.length === 0 && (
            <span className="flex items-center gap-2.5 border-l-2 border-solid border-l-line-2 bg-panel px-3 py-[0.5625rem] font-body text-[0.8125rem] font-medium leading-[1.3] text-txt-muted">
              <i className="h-[0.4375rem] w-[0.4375rem] flex-none rounded-full bg-line-2" />
              {t("feedEmpty")}
            </span>
          )}
          {feed.map((f, i) => (
            <span
              key={i}
              className={cn(
                "flex items-center gap-2.5 border-l-2 border-solid bg-panel px-3 py-[0.5625rem] font-body text-[0.8125rem] font-medium leading-[1.3] text-txt",
                f.ln,
              )}
              style={{ ["--i"]: i } as React.CSSProperties}
            >
              <i className={cn("h-[0.4375rem] w-[0.4375rem] flex-none rounded-full animate-[lv4-blink_2s_infinite] motion-reduce:animate-none", f.tp)} />
              {f.t}
            </span>
          ))}
        </div>
        <div className="mb-[1.125rem] flex flex-wrap gap-2">
          <Chip>{t("chipForum")}</Chip>
          <Chip>{t("chipSorteos")}</Chip>
          <Chip>{t("chipTeams")}</Chip>
        </div>
        <div className={CTA_ROW}>
          <Button variant="pri" iconRight="arrow" href="/community" className={PRI_GLOW}>
            {t("ctaJoin")}
          </Button>
          <Button href={DISCORD}>{t("ctaDiscord")}</Button>
        </div>
      </div>
    </TvCP>
  )
}
