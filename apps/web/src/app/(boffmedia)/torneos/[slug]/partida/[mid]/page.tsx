"use client"

import * as React from "react"
import Link from "next/link"
import { use } from "react"
import { cn } from "@/lib/utils"
import { Button, Modal, toast, Icon, Spinner } from "@/components/boffmedia/primitives"
import { useBoffSession } from "@/services/useBoffSession"
import {
  TmRoundHeader,
  TmOpponentCard,
  TmTeamsheet,
  TM_CARD,
  TM_CARD_HEAD,
  TM_CARD_H3,
  type TmPlayer,
} from "@/components/boffmedia/ui/tournaments"
import {
  TournamentsService,
  type TnCompetitorApi,
  type TnMatchDetailApi,
  type TnMatchMessageApi,
  type TnMatchSideRecordApi,
  type TnMonApi,
} from "@/services/api/boffmedia/tournamentsService"
import { parseShowdownPaste } from "@/features/vgc-tracker/showdown-parse"

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

// ── report panel (server-driven state machine) ────────────────────────────────
type PanelPhase = "edit" | "awaiting" | "incoming" | "verified" | "dispute"

function LiveReportPanel({
  detail,
  meName,
  oppName,
  onChanged,
}: {
  detail: TnMatchDetailApi
  meName: string
  oppName: string
  onChanged: () => void
}) {
  const bestOf = Math.max(1, detail.bestOf)
  const majority = Math.ceil(bestOf / 2)
  const [games, setGames] = React.useState<(string | null)[]>(() => Array(bestOf).fill(null))
  const [busy, setBusy] = React.useState(false)
  React.useEffect(() => {
    setGames((g) => (g.length === bestOf ? g : Array(bestOf).fill(null)))
  }, [bestOf])

  const resolved = detail.status === "completed" || detail.status === "bye"
  const proposal = detail.proposal
  const phase: PanelPhase = resolved
    ? "verified"
    : proposal?.state === "disputed"
      ? "dispute"
      : proposal
        ? proposal.mine
          ? "awaiting"
          : "incoming"
        : "edit"

  // My score line from the viewer's perspective.
  const myFinal = detail.viewerRole === "top" ? detail.g1 ?? 0 : detail.g2 ?? 0
  const oppFinal = detail.viewerRole === "top" ? detail.g2 ?? 0 : detail.g1 ?? 0
  const iWon = myFinal > oppFinal

  const wins = games.filter((g) => g === "W").length
  const losses = games.filter((g) => g === "L").length
  const decisive = wins >= majority || losses >= majority
  const resultText =
    wins > losses ? `Ganas esta partida ${wins}-${losses}` : losses > wins ? `Pierdes esta partida ${losses}-${wins}` : `Marca el resultado`

  const shown: (string | null)[] =
    phase === "incoming" || phase === "dispute"
      ? Array.from({ length: bestOf }, (_, i) => proposal?.games[i] ?? null)
      : phase === "awaiting"
        ? Array.from({ length: bestOf }, (_, i) => proposal?.games[i] ?? null)
        : phase === "verified"
          ? verifiedGames(myFinal, oppFinal, bestOf)
          : games

  const setGame = (i: number, val: string) => {
    if (phase !== "edit") return
    setGames((g) => {
      const n = g.slice()
      n[i] = n[i] === val ? null : val
      return n
    })
  }

  const submit = async () => {
    if (!decisive || busy) return
    setBusy(true)
    const str = games.filter((g): g is string => g != null).join("")
    const r = await TournamentsService.propose(detail.tournamentId, detail.id, str)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else onChanged()
  }
  const verdict = async (accept: boolean) => {
    if (busy) return
    setBusy(true)
    const r = await TournamentsService.confirm(detail.tournamentId, detail.id, accept)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else onChanged()
  }

  const pill = "inline-flex items-center gap-1.5 border border-solid px-[9px] py-[5px] font-mono text-[10px]/none font-bold uppercase tracking-[0.06em]"
  const gbtn = "flex-1 cursor-pointer border border-solid border-line-2 bg-base px-2 py-[11px] font-body text-[13px]/none font-semibold text-txt-muted transition-colors enabled:hover:border-txt-muted enabled:hover:text-txt disabled:cursor-default"
  const banner = "m-4 flex items-center gap-[11px] p-[14px] font-body text-[13px]/[1.45] [&>b]:font-bold"
  const locked = phase !== "edit"

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>Reportar partidas</h3>
        {phase === "verified" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok")}><Icon name="check" size={12} />Verificada</span>}
        {phase === "awaiting" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn")}><Icon name="clock" size={12} />Esperando confirmación</span>}
        {phase === "dispute" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad")}><Icon name="alert" size={12} />En disputa</span>}
        {phase === "incoming" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn")}><Icon name="clock" size={12} />Te toca verificar</span>}
      </div>

      {phase === "incoming" && (
        <div className={cn(banner, "text-info bg-info-soft border border-solid border-[color:color-mix(in_srgb,var(--info)_40%,transparent)]")}>
          <Icon name="info" size={15} className="flex-none" />
          <span><b>{oppName}</b> ha reportado el resultado. Revísalo y verifica si es correcto.</span>
        </div>
      )}

      <div className={cn("grid gap-2.5 p-4", locked && "[&_button:not(.on)]:opacity-40")}>
        {Array.from({ length: bestOf }, (_, i) => (
          <div key={i} className="grid grid-cols-[90px_1fr] items-center gap-4 max-[760px]:grid-cols-[70px_1fr]">
            <span className="text-right font-mono text-[12px]/none font-bold uppercase tracking-[0.06em] text-txt-muted">Partida {i + 1}</span>
            <div className="flex max-w-[300px] gap-2.5">
              <button type="button" disabled={locked} onClick={() => setGame(i, "W")} className={cn(gbtn, shown[i] === "W" && "on border-ok bg-ok-soft text-ok")}>Victoria</button>
              <button type="button" disabled={locked} onClick={() => setGame(i, "L")} className={cn(gbtn, shown[i] === "L" && "on border-bad bg-bad-soft text-bad")}>Derrota</button>
            </div>
          </div>
        ))}
      </div>

      {phase === "edit" && (
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line bg-base px-4 py-3.5">
          <span className={cn("font-body text-[14px]/[1.3]", decisive ? "font-bold text-txt" : "text-txt-dim")}>{decisive ? resultText : "Marca el resultado de cada partida"}</span>
          <Button variant="pri" size="sm" icon="check" disabled={!decisive || busy} onClick={submit}>Enviar reporte</Button>
        </div>
      )}

      {phase === "awaiting" && proposal && (
        <AwaitingFoot expiresAt={proposal.expiresAt} oppName={oppName} mine={gamesLabel(proposal.games)} onExpired={onChanged} />
      )}

      {phase === "incoming" && proposal && (
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line bg-base px-4 py-3.5">
          <span className="font-body text-[14px]/[1.3] font-bold text-txt">
            Según {oppName}: {gamesToMyScore(proposal.games, false)}-{gamesToMyScore(proposal.games, true)} a su favor
          </span>
          <span className="inline-flex gap-2.5">
            <Button variant="ghost" size="sm" icon="alert" disabled={busy} onClick={() => verdict(false)}>Disputar</Button>
            <Button variant="pri" size="sm" icon="check" disabled={busy} onClick={() => verdict(true)}>Verificar</Button>
          </span>
        </div>
      )}

      {phase === "verified" && (
        <div className={cn(banner, "text-ok bg-ok-soft border border-solid border-[color:color-mix(in_srgb,var(--ok)_40%,transparent)]")}>
          <Icon name="check" size={16} className="flex-none" />
          <span><b>Resultado verificado {Math.max(myFinal, oppFinal)}-{Math.min(myFinal, oppFinal)}.</b> {iWon ? "¡Victoria!" : "Derrota — a por la siguiente."}</span>
        </div>
      )}
      {phase === "dispute" && (
        <div className={cn(banner, "text-bad bg-bad-soft border border-solid border-[color:color-mix(in_srgb,var(--bad)_40%,transparent)]")}>
          <Icon name="alert" size={16} className="flex-none" />
          <span><b>Resultado en disputa.</b> Un juez revisará la mesa. Usad el chat para explicar lo ocurrido.</span>
        </div>
      )}
    </section>
  )
}

/** Reconstruct a plausible per-game W/L display for a settled score (2-1 → WLW…). */
function verifiedGames(my: number, opp: number, bestOf: number): (string | null)[] {
  const out: (string | null)[] = Array(bestOf).fill(null)
  let i = 0
  for (let w = 0; w < my && i < bestOf; w++) out[i++] = "W"
  for (let l = 0; l < opp && i < bestOf; l++) out[i++] = "L"
  return out
}
function gamesToMyScore(games: string, wins: boolean): number {
  return [...games].filter((c) => (wins ? c === "W" : c === "L")).length
}
function gamesLabel(games: string): string {
  return `${gamesToMyScore(games, true)}-${gamesToMyScore(games, false)}`
}

function AwaitingFoot({
  expiresAt,
  oppName,
  mine,
  onExpired,
}: {
  expiresAt: string
  oppName: string
  mine: string
  onExpired: () => void
}) {
  const total = React.useRef<number | null>(null)
  const calc = React.useCallback(
    () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
    [expiresAt],
  )
  const [left, setLeft] = React.useState(calc)
  if (total.current == null || left > total.current) total.current = Math.max(left, 1)

  React.useEffect(() => {
    setLeft(calc())
    const id = setInterval(() => {
      const v = calc()
      setLeft(v)
      if (v <= 0) {
        clearInterval(id)
        onExpired()
      }
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  return (
    <div className="grid gap-[9px] border-t border-solid border-line bg-base px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <span className="font-body text-[14px]/[1.3] font-bold text-txt">Has reportado {mine}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[12px]/none text-warn">
          <Icon name="clock" size={12} />Auto-verificación en <b className="font-bold">{fmt(left)}</b>
        </span>
      </div>
      <div className="h-1 overflow-hidden bg-line">
        <i className="block h-full bg-warn transition-[width] duration-1000 ease-linear" style={{ width: `${(left / (total.current || 1)) * 100}%` }} />
      </div>
      <p className="m-0 max-w-[68ch] font-body text-[11.5px]/[1.5] text-txt-muted">
        El reporte aparece al instante en la mesa de {oppName}. Si no responde a tiempo se validará automáticamente para no bloquear el torneo.
      </p>
    </div>
  )
}

// ── table chat (polled) ────────────────────────────────────────────────────────
function LiveMatchChat({
  detail,
  onChanged,
}: {
  detail: TnMatchDetailApi
  onChanged: () => void
}) {
  const { session } = useBoffSession()
  const meUserId = session?.user?.id ? Number(session.user.id) : null
  const [msgs, setMsgs] = React.useState<TnMatchMessageApi[]>([])
  const [input, setInput] = React.useState("")
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const lastId = msgs.length ? msgs[msgs.length - 1].id : 0

  const load = React.useCallback(async () => {
    const r = await TournamentsService.getMessages(detail.tournamentId, detail.id, 0)
    if (r.data) setMsgs(r.data)
  }, [detail.tournamentId, detail.id])
  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    const id = setInterval(async () => {
      const r = await TournamentsService.getMessages(detail.tournamentId, detail.id, lastId)
      if (r.data?.length) setMsgs((cur) => [...cur, ...r.data!.filter((m) => !cur.some((c) => c.id === m.id))])
    }, 8000)
    return () => clearInterval(id)
  }, [detail.tournamentId, detail.id, lastId])

  React.useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const send = async () => {
    const v = input.trim()
    if (!v) return
    setInput("")
    const r = await TournamentsService.postMessage(detail.tournamentId, detail.id, v)
    if (r.error) toast.error(r.error)
    else if (r.data) setMsgs((cur) => [...cur, r.data!])
  }
  const judge = async () => {
    const r = await TournamentsService.requestJudge(detail.tournamentId, detail.id)
    if (r.error) toast.error(r.error)
    else {
      toast("Juez avisado")
      onChanged()
      load()
    }
  }
  const judgeRequested = detail.judgeRequestedAt != null

  const hm = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>Chat de mesa</h3>
        <Button variant="default" size="sm" icon="alert" disabled={judgeRequested} onClick={judge} className={cn(!judgeRequested && "border-warn text-warn hover:border-warn hover:bg-warn hover:text-white")}>
          {judgeRequested ? "Juez avisado" : "Solicitar juez"}
        </Button>
      </div>
      <div ref={bodyRef} className="flex h-[320px] flex-col gap-2.5 overflow-y-auto bg-base p-4">
        {msgs.length === 0 && (
          <p className="m-auto font-mono text-[11px] uppercase tracking-[0.08em] text-txt-dim">La mesa está abierta. ¡Buena suerte!</p>
        )}
        {msgs.map((m) => {
          if (m.kind === "sys")
            return (
              <div key={m.id} className="mx-auto inline-flex max-w-[82%] items-center gap-2 border border-solid border-[color:color-mix(in_srgb,var(--info)_25%,transparent)] bg-info-soft px-3 py-1.5 text-center font-body text-[11.5px]/[1.3] font-medium text-txt-muted">
                <span className="font-mono text-[10px]/none font-semibold text-info">{hm(m.createdAt)}</span>
                {m.body}
              </div>
            )
          const isMe = m.authorUserId != null && m.authorUserId === meUserId
          const isJudge = m.kind === "judge"
          return (
            <div key={m.id} className={cn("flex max-w-[82%]", isMe ? "self-end" : "self-start")}>
              <div className={cn("grid gap-[3px] border border-solid px-3 py-2", isMe ? "border-accent-line bg-accent-soft" : isJudge ? "border-[color:color-mix(in_srgb,var(--warn)_35%,transparent)] bg-warn-soft" : "border-line bg-panel-2")}>
                <div className="flex items-baseline gap-2">
                  <b className={cn("font-mono text-[11px]/none font-bold", isMe ? "text-accent-bright" : isJudge ? "text-warn" : "text-txt")}>
                    {isJudge ? `${m.authorName ?? "Staff"} · juez` : m.authorName ?? "Jugador"}
                  </b>
                  <i className="font-mono text-[10px]/none not-italic text-txt-dim">{hm(m.createdAt)}</i>
                </div>
                <p className="m-0 break-words font-body text-[13.5px]/[1.45] text-txt">{m.body}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2.5 border-t border-solid border-line bg-panel px-4 py-3">
        <input
          className="min-w-0 flex-1 border border-solid border-line-2 bg-base px-3 py-2.5 font-body text-[13.5px]/[1.3] text-txt focus:border-accent-line focus:outline focus:outline-2 focus:outline-accent-line"
          value={input}
          placeholder="Escribe un mensaje… (comparte tu ID de combate)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send() }}
        />
        <Button variant="pri" size="sm" icon="arrow" onClick={send}>Enviar</Button>
      </div>
    </section>
  )
}

// ── own teamsheet upload ───────────────────────────────────────────────────────
function MyTeamsheetCard({ tournamentId }: { tournamentId: number }) {
  const [open, setOpen] = React.useState(false)
  const [paste, setPaste] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const parsed = React.useMemo(() => (paste.trim() ? parseShowdownPaste(paste) : []), [paste])

  const save = async () => {
    if (!parsed.length) return toast.error("Pega tu equipo en formato Showdown")
    setBusy(true)
    const mons: TnMonApi[] = parsed.map((s, i) => ({
      slot: i + 1,
      name: s.speciesName,
      item: s.item,
      ability: s.ability,
      tera: s.teraType,
      moves: s.moves.slice(0, 4),
    }))
    const r = await TournamentsService.setTeamsheet(tournamentId, mons)
    setBusy(false)
    if (r.error) toast.error(r.error)
    else {
      toast.success("Hoja de equipo guardada")
      setOpen(false)
      setPaste("")
    }
  }

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>Mi hoja de equipo</h3>
        <Button size="sm" icon="edit" onClick={() => setOpen(true)}>Actualizar</Button>
      </div>
      <p className="m-0 flex items-center gap-2 p-4 font-body text-[12px]/[1.5] text-txt-muted">
        <Icon name="info" size={12} className="flex-none" />
        Tu rival de cada ronda verá esta hoja (open teamsheet). Pega tu equipo exportado de Pokémon Showdown.
      </p>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Mi hoja de equipo"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-txt-dim">{parsed.length ? `${parsed.length} Pokémon detectados` : "Formato Showdown"}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="pri" size="sm" disabled={busy || !parsed.length} onClick={save}>Guardar</Button>
            </div>
          </div>
        }
      >
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={12}
          placeholder={"Incineroar @ Safety Goggles\nAbility: Intimidate\nTera Type: Ghost\n- Fake Out\n- Flare Blitz\n…"}
          className="w-full resize-y border border-solid border-line bg-base px-3 py-2 font-mono text-[12px] leading-[1.5]"
        />
      </Modal>
    </section>
  )
}

// ── spectator / admin read-only summary ───────────────────────────────────────
function SpectatorSummary({
  detail,
  showChat,
  onChanged,
}: {
  detail: TnMatchDetailApi
  showChat: boolean
  onChanged: () => void
}) {
  const done = detail.status === "completed" || detail.status === "bye"
  const line = (c: TnCompetitorApi | null, score: number | null, winner: boolean) => (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-3", winner && "bg-ok-soft")}>
      <span className={cn("font-display text-[18px] font-bold uppercase", winner ? "text-ok" : "text-txt")}>
        {c?.name ?? "—"}
      </span>
      <span className="font-mono text-[20px] font-bold">{done ? score ?? 0 : "–"}</span>
    </div>
  )
  const winId = detail.winner?.id
  return (
    <>
      <section className={TM_CARD}>
        <div className={TM_CARD_HEAD}>
          <h3 className={TM_CARD_H3}>{done ? "Resultado" : "En juego"}</h3>
          {detail.proposalState === "disputed" && (
            <span className="inline-flex items-center gap-1.5 border border-solid border-bad px-2 py-1 font-mono text-[10px] font-bold uppercase text-bad">
              <Icon name="alert" size={12} />En disputa
            </span>
          )}
        </div>
        {line(detail.top, detail.g1, done && winId != null && winId === detail.top?.id)}
        <div className="border-t border-solid border-line" />
        {line(detail.bot, detail.g2, done && winId != null && winId === detail.bot?.id)}
      </section>
      {showChat && <LiveMatchChat detail={detail} onChanged={onChanged} />}
    </>
  )
}
