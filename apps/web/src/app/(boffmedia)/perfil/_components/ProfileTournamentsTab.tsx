"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Button, Empty, Icon, Spinner } from "@boffmedia/ui"
import { DkLive } from "@/components/boffmedia/ui/tools/datakit"
import { TourLive } from "@/components/boffmedia/ui/profile"
import type { MyTournamentApi } from "@/services/api/boffmedia/tournamentsService"
import { useProfileTournaments } from "./useProfileTournaments"

type Bucket = "live" | "soon" | "done"
const BUCKET_OF: Record<string, Bucket> = { live: "live", registration: "soon", completed: "done" }

function fmtDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" })
  } catch {
    return iso
  }
}

function MtRow({ tn }: { tn: MyTournamentApi }) {
  const t = useTranslations("profile")
  const locale = useLocale()
  const hue = tn.hue ?? 210
  const bucket = BUCKET_OF[tn.status] ?? "done"
  const seal = (tn.gameTitle ?? tn.format).slice(0, 3).toUpperCase()

  const sub =
    bucket === "soon"
      ? t("tours.registered") + (tn.startDate ? ` · ${fmtDate(tn.startDate, locale)}` : "")
      : bucket === "done" && tn.isChampion
        ? null
        : t(`tournaments.status.${tn.myStatus}`)

  return (
    <Link
      href={`/torneos/${tn.slug}`}
      className="group flex items-center gap-[0.875rem] border border-solid border-line border-l-[3px] bg-panel px-[0.875rem] py-3 transition-colors hover:bg-panel-2"
      style={{ borderLeftColor: `hsl(${hue} 55% 48%)` }}
    >
      <span
        className="grid h-10 w-10 flex-none place-items-center border border-solid font-mono text-[0.75rem]/none font-extrabold tracking-[0.04em]"
        style={{ color: `hsl(${hue} 65% 64%)`, background: `hsl(${hue} 55% 46% / 0.14)`, borderColor: `hsl(${hue} 55% 46% / 0.3)` }}
      >
        {seal}
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex items-center gap-[0.5625rem]">
          <b className="truncate font-display text-[0.9375rem]/[1.1] font-bold tracking-[0.01em]">{tn.name}</b>
          {tn.isChampion && (
            <span
              className="flex-none border border-solid px-1.5 py-[3px] font-mono text-[0.5625rem]/none font-bold uppercase tracking-[0.08em]"
              style={{ color: `hsl(${hue} 65% 64%)`, borderColor: `hsl(${hue} 55% 46% / 0.4)` }}
            >
              {t("tournaments.champion")}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-2 font-mono text-[0.75rem]/none font-medium text-txt-muted">
          <DkLive status={bucket} size="sm" />
          {sub}
        </span>
      </div>
      <span className="grid h-[2.125rem] w-[2.125rem] flex-none place-items-center border border-solid border-line-2 bg-base text-txt-muted transition-colors group-hover:border-accent-line group-hover:text-accent-bright">
        <Icon name="arrow" size={15} />
      </span>
    </Link>
  )
}

export function ProfileTournamentsTab() {
  const t = useTranslations("profile")
  const { list, featured, loading } = useProfileTournaments()

  if (loading) {
    return (
      <div className="grid place-items-center py-10">
        <Spinner />
      </div>
    )
  }
  if (list.length === 0) {
    return <Empty icon="trophy" title={t("tours.emptyTitle")} lead={t("tours.emptyBody")} />
  }

  const groups: [Bucket, string][] = [
    ["live", t("tours.groups.live")],
    ["soon", t("tours.groups.soon")],
    ["done", t("tours.groups.done")],
  ]

  return (
    <section>
      <div className="-mt-2 mb-2 flex justify-end">
        <Button variant="ghost" size="sm" iconRight="arrow" href="/torneos">
          {t("tours.viewAll")}
        </Button>
      </div>

      {featured && (
        <TourLive {...featured.tour} hue={featured.hue} action={featured.action} liveLabel={t("live.badge")} className="mb-4" />
      )}

      <div className="grid gap-[1.125rem]">
        {groups.map(([bucket, label]) => {
          const rows = list.filter(
            (tn) => (BUCKET_OF[tn.status] ?? "done") === bucket && tn.slug !== featured?.slug,
          )
          if (!rows.length) return null
          return (
            <div key={bucket}>
              <div className="mb-[0.5625rem] flex items-center gap-2.5 font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.14em] text-txt-muted">
                {label}
                <span className="grid h-[1.125rem] min-w-[1.125rem] place-items-center border border-solid border-line bg-panel-2 px-[0.3125rem] text-[0.625rem] text-txt-dim">
                  {rows.length}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid gap-2">
                {rows.map((tn) => (
                  <MtRow key={tn.id} tn={tn} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
