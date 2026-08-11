"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Chip } from "@boffmedia/ui"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_ROW, GLARE, HUD_FRAME, PRI_GLOW } from "../landing-shared"
import { DISCORD, TV3_FEED } from "../landing-data"
import { useSiteActivity, useSiteStats } from "@/hooks/community/useCommunity"
import { useFormat } from "@boffmedia/ui/useFormat"

export function TvComunidad() {
  const t = useTranslations("boffmedia.landing.comunidad")
  const { number: formatNumber } = useFormat()
  const { activity } = useSiteActivity(6)
  const { stats } = useSiteStats()
  // Real activity feeds the ticker; falls back to the editorial placeholders
  // while loading or if there's no recorded activity yet.
  const feed = activity.length
    ? activity.slice(0, 4).map((a) =>
        a.type === "achievement"
          ? { k: "win", t: t("feedAchievement", { actor: a.actor, name: a.name }), ln: "border-l-ok", tp: "bg-ok" }
          : { k: "join", t: t("feedJoin", { actor: a.actor, name: a.name }), ln: "border-l-signal", tp: "bg-signal" },
      )
    : TV3_FEED

  // Real competitor count feeds the lead; drops the clause while stats load so
  // no number is fabricated.
  const lead =
    stats && stats.participants > 0
      ? t("leadWithParticipants", { count: formatNumber(stats.participants) })
      : t("leadNoParticipants")

  return (
    <TvCP
      id="tv-cp5"
      n="05"
      side="l"
      kick={<Decode text={t("kick")} />}
      title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
      lead={lead}
    >
      <div
        data-glare
        className={cn(
          "relative overflow-hidden border border-solid border-line px-6 pb-6 pt-[22px] backdrop-blur-[6px] [background:rgba(10,12,16,0.5)] [clip-path:polygon(0_0,100%_0,100%_100%,16px_100%,0_calc(100%_-_16px))] cut-edge-bl [--cut-e:16px] [[data-theme=light]_&]:[background:rgba(255,255,255,0.55)]",
          GLARE,
          HUD_FRAME,
        )}
      >
        <div className="mb-[18px] grid gap-2" aria-hidden="true">
          {feed.map((f, i) => (
            <span
              key={i}
              className={cn(
                "flex items-center gap-2.5 border-l-2 border-solid bg-panel px-3 py-[9px] font-body text-[13px] font-medium leading-[1.3] text-txt",
                f.ln,
              )}
              style={{ ["--i"]: i } as React.CSSProperties}
            >
              <i className={cn("h-[7px] w-[7px] flex-none rounded-full animate-[lv4-blink_2s_infinite] motion-reduce:animate-none", f.tp)} />
              {"tk" in f && typeof f.tk === "string" ? t(f.tk) : f.t}
            </span>
          ))}
        </div>
        <div className="mb-[18px] flex flex-wrap gap-2">
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
