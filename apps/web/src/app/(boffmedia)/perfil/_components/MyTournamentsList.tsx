"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Empty, Spinner } from "@/components/boffmedia/primitives"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useMyTournaments } from "@/hooks/tournaments/useMyTournaments"

export function MyTournamentsList() {
  const t = useTranslations("profile")
  const { tournaments, isLoading } = useMyTournaments()

  if (isLoading) {
    return (
      <div className="grid place-items-center py-6">
        <Spinner />
      </div>
    )
  }
  if (tournaments.length === 0) {
    return <Empty icon="trophy" title={t("tournaments.emptyTitle")} lead={t("tournaments.emptyBody")} />
  }

  const STATUS_TONE: Record<string, string> = {
    active: "text-ok",
    eliminated: "text-txt-dim",
    withdrew: "text-txt-dim",
    disqualified: "text-bad",
  }

  return (
    <div className="grid gap-1.5">
      {tournaments.map((tn) => (
        <Link
          key={tn.id}
          href={`/torneos/${tn.slug}`}
          className="flex items-center gap-3 border border-solid border-line bg-base px-3 py-2 transition-colors hover:border-line-2"
        >
          <TnFormatBadge format={tn.format} size="sm" />
          <span className="flex-1 truncate font-body text-[13px] font-semibold">{tn.name}</span>
          {tn.isChampion ? (
            <span className="font-mono text-[10.5px] font-semibold text-accent-bright">
              🏆 {t("tournaments.champion")}
            </span>
          ) : (
            <span className={cn("font-mono text-[10.5px] uppercase tracking-[0.06em]", STATUS_TONE[tn.myStatus] ?? "text-txt-dim")}>
              {t(`tournaments.status.${tn.myStatus}`)}
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-txt-dim">{tn.status}</span>
        </Link>
      ))}
    </div>
  )
}
