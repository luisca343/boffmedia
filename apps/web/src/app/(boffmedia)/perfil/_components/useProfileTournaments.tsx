"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMyTournaments } from "@/hooks/tournaments/useMyTournaments"
import {
  TournamentsService,
  type MyTournamentApi,
  type TournamentDetailApi,
  type TnViewApi,
  type TnMatchApi,
  type TnStandingApi,
} from "@/services/api/boffmedia/tournamentsService"
import type { TourData } from "@/components/boffmedia/ui/profile"

export interface FeaturedTour {
  slug: string
  tour: TourData
  hue: number
  action?: { label: string; href: string }
}

function findMatch(view: TnViewApi, id: number): TnMatchApi | null {
  const rounds: TnMatchApi[][] = [
    ...(view.rounds ?? []),
    ...(view.winners ?? []),
    ...(view.losers ?? []),
    ...(view.knockout?.rounds ?? []),
  ]
  for (const round of rounds) {
    for (const m of round) if (m.id === id) return m
  }
  for (const m of [view.grandFinal, view.thirdPlace]) if (m && m.id === id) return m
  return null
}

function findStanding(view: TnViewApi, pid: string): TnStandingApi | null {
  const tables: (TnStandingApi[] | undefined)[] = [
    view.table,
    view.standings,
    ...(view.groups?.map((g) => g.standings) ?? []),
  ]
  for (const table of tables) {
    const row = table?.find((r) => r.c.id === pid)
    if (row) return row
  }
  return null
}

/**
 * The signed-in user's competitive activity for the profile «Torneos» tab:
 * the full list of tournaments they've entered (`GET /tournaments/mine`) plus,
 * when they're in a `live` tournament with an active (unreported) match, a
 * `featured` banner. No new endpoint — the live tournament's detail already
 * resolves the viewer's current match via `myMatchId`/`viewerParticipantId`, so
 * round/opponent/record are derived; every field is gated so it fabricates nothing.
 */
export function useProfileTournaments(): {
  list: MyTournamentApi[]
  featured: FeaturedTour | null
  loading: boolean
} {
  const t = useTranslations("profile.live")
  const { tournaments, isLoading } = useMyTournaments()
  const live: MyTournamentApi | null =
    tournaments.find((tn) => tn.status === "live" && tn.myStatus === "active") ?? null

  const [detail, setDetail] = React.useState<TournamentDetailApi | null>(null)
  const [detailLoading, setDetailLoading] = React.useState(false)
  const slug = live?.slug ?? null

  React.useEffect(() => {
    let cancelled = false
    if (!slug) {
      setDetail(null)
      return
    }
    setDetailLoading(true)
    TournamentsService.get(slug)
      .then((r) => {
        if (!cancelled) setDetail(r.data ?? null)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const featured = React.useMemo<FeaturedTour | null>(() => {
    if (!live || !detail || detail.slug !== live.slug || detail.myMatchId == null) return null
    const match = findMatch(detail.view, detail.myMatchId)
    const opp = match ? (match.top?.id === detail.viewerParticipantId ? match.bot : match.top) : null
    if (!match || !opp) return null // only feature when there's an active match to enter

    const fmtLabel = t(`format.${live.format}`)
    const stats: { k: string; v: React.ReactNode }[] = []
    if (detail.view.done != null && detail.view.total != null && detail.view.total > 0) {
      stats.push({ k: t("progress"), v: <>{detail.view.done}<em>/{detail.view.total}</em></> })
    }
    if (detail.viewerParticipantId) {
      const row = findStanding(detail.view, detail.viewerParticipantId)
      if (row) {
        stats.push({ k: t("record"), v: row.d > 0 ? `${row.w}–${row.l}–${row.d}` : `${row.w}–${row.l}` })
        if (row.pts) stats.push({ k: t("points"), v: row.pts })
      }
    }

    const tour: TourData = {
      name: live.name,
      format: live.gameTitle ? `${live.gameTitle} · ${fmtLabel}` : fmtLabel,
      where: live.gameTitle ?? undefined,
      stats: stats.length ? stats : undefined,
      roundLabel: t("round", { n: match.roundNumber }),
      vs: <>{t("vs")} <b>{opp.name}</b></>,
    }
    return {
      slug: live.slug,
      tour,
      hue: live.hue ?? 28,
      action: { label: t("enter"), href: `/torneos/${live.slug}/partida/${detail.myMatchId}` },
    }
  }, [live, detail, t])

  return { list: tournaments, featured, loading: isLoading || (!!live && detailLoading && !detail) }
}
