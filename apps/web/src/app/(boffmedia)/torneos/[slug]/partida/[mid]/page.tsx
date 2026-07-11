"use client"

import * as React from "react"
import Link from "next/link"
import { use } from "react"
import { Button, Spinner } from "@/components/boffmedia/primitives"
import {
  TmRoundHeader,
  TmOpponentCard,
  TmTeamsheet,
  type TmPlayer,
} from "@/components/boffmedia/ui/tournaments"
import {
  TournamentsService,
  type TnCompetitorApi,
  type TnMatchDetailApi,
  type TnMatchSideRecordApi,
  type TnMonApi,
} from "@/services/api/boffmedia/tournamentsService"
import { LiveReportPanel } from "./_components/LiveReportPanel"
import { LiveMatchChat } from "./_components/LiveMatchChat"
import { MyTeamsheetCard } from "./_components/MyTeamsheetCard"
import { SpectatorSummary } from "./_components/SpectatorSummary"

function toPlayer(
  c: TnCompetitorApi | null,
  record: TnMatchSideRecordApi | null,
  mons?: TnMonApi[] | null,
): TmPlayer | null {
  if (!c) return null
  return {
    id: c.id,
    kind: c.kind,
    name: c.name,
    tag: c.tag ?? c.name,
    flag: c.flag ?? undefined,
    country: c.country ?? undefined,
    hue: c.hue ?? undefined,
    w: record?.w ?? 0,
    l: record?.l ?? 0,
    d: record?.d ?? 0,
    pts: record?.pts ?? 0,
    _pk: mons?.map((m) => ({
      slot: m.slot,
      dex: m.dex,
      name: m.name,
      item: m.item ?? "—",
      ability: m.ability,
      tera: m.tera ?? "—",
      moves: m.moves,
    })),
  }
}

export default function PartidaPage({
  params,
}: {
  params: Promise<{ slug: string; mid: string }>
}) {
  const { slug, mid } = use(params)
  const matchId = Number(mid)
  const [detail, setDetail] = React.useState<TnMatchDetailApi | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refetch = React.useCallback(async () => {
    const r = await TournamentsService.getMatchDetail(slug, matchId)
    if (r.data) setDetail(r.data)
    setLoading(false)
  }, [slug, matchId])

  React.useEffect(() => {
    refetch()
  }, [refetch])

  // Poll while the match is open so the rival's proposal/verdict shows up.
  const open = detail != null && detail.status !== "completed" && detail.status !== "bye"
  React.useEffect(() => {
    if (!open) return
    const id = setInterval(() => refetch(), 10000)
    return () => clearInterval(id)
  }, [open, refetch])

  if (loading) {
    return (
      <div className="wrap grid place-items-center py-24">
        <Spinner />
      </div>
    )
  }
  if (!detail) {
    return (
      <main className="wrap py-24 text-center">
        <p className="font-display text-[22px] font-bold uppercase">Partida no encontrada</p>
        <Button href={`/torneos/${slug}`} size="sm" className="mt-4">
          Volver al torneo
        </Button>
      </main>
    )
  }

  const isPlayer = detail.viewerRole === "top" || detail.viewerRole === "bot"
  const meSide = detail.viewerRole === "top" ? detail.top : detail.bot
  const oppSide = detail.viewerRole === "top" ? detail.bot : detail.top
  const opp = toPlayer(
    oppSide,
    detail.viewerRole === "top" ? detail.botRecord : detail.topRecord,
    detail.opponentTeamsheet,
  )

  return (
    <main className="wrap py-10">
      <div className="mb-4">
        <Link
          href={`/torneos/${slug}`}
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-txt-dim transition-colors hover:text-accent-bright"
        >
          ← {detail.tournamentName}
        </Link>
      </div>

      <div className="mx-auto grid max-w-[940px] gap-3.5">
        <TmRoundHeader
          comp={{ title: detail.tournamentName }}
          roundNo={detail.roundNumber}
          tableNo={detail.position + 1}
          status={detail.status === "completed" || detail.status === "bye" ? "final" : "playing"}
          bestOf={detail.bestOf}
          scheduledAt={detail.scheduledAt}
        />

        {isPlayer && opp ? (
          <>
            <TmOpponentCard opp={opp} />
            <LiveReportPanel detail={detail} meName={meSide?.name ?? "Tú"} oppName={opp.name} onChanged={refetch} />
            <LiveMatchChat detail={detail} onChanged={refetch} />
            {opp._pk?.length ? (
              <TmTeamsheet opp={opp} onCalc={() => window.open("https://calc.pokemonshowdown.com", "_blank")} />
            ) : null}
            <MyTeamsheetCard tournamentId={detail.tournamentId} />
          </>
        ) : (
          <SpectatorSummary detail={detail} showChat={detail.viewerRole === "admin"} onChanged={refetch} />
        )}
      </div>
    </main>
  )
}
