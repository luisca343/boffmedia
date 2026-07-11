"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Panel, Field, Input, Select, Button, toast, Spinner } from "@/components/boffmedia/primitives"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import { UsersService } from "@/services/api/boffmedia/usersService"
import {
  TournamentsService,
  type TnFormat,
  type TnKind,
  type TnMatchApi,
  type TnStatus,
  type TnPhaseApi,
  type TnPhaseInput,
  type TnPhaseFormat,
  type TnAdvanceType,
  type TnParticipantStatus,
  type TnCompetitorApi,
} from "@/services/api/boffmedia/tournamentsService"
import { FORMATS, KINDS, PHASE_FORMATS, ADVANCE_TYPE_OPTIONS, PARTICIPANT_STATUS, VGC_PRESET, PHASE_STATUS_TONE } from "./constants"
import { SectionHead, Stat } from "./shared"
import { RoundScheduler } from "./PhasesEditor"

export function ReportPanel({
  tid,
  bestOf,
  matches,
  onReported,
}: {
  tid: number
  bestOf: number
  matches: TnMatchApi[]
  onReported: () => void
}) {
  // Scores start blank so a stray click can never record a phantom result — the
  // admin must enter a real score (or use a walkover) before OK enables.
  const [scores, setScores] = useState<Record<number, { a: string; b: string }>>({})
  const [amendId, setAmendId] = useState<number | null>(null)

  const send = async (
    m: TnMatchApi,
    body: {
      topScore: number
      botScore: number
      winnerParticipantId?: number
      amend?: boolean
      forfeit?: boolean
    },
  ) => {
    const r = await TournamentsService.report(tid, m.id, body)
    if (r.error) toast.error(r.error)
    else { setAmendId(null); onReported() }
  }

  const report = async (m: TnMatchApi, amend = false) => {
    const s = scores[m.id] ?? { a: "", b: "" }
    if (s.a === "" || s.b === "") return toast.error("Introduce el resultado")
    const a = +s.a
    const b = +s.b
    const winnerParticipantId = a === b ? undefined : a > b ? Number(m.top!.id) : Number(m.bot!.id)
    await send(m, { topScore: a, botScore: b, winnerParticipantId, amend })
  }

  const forfeit = async (m: TnMatchApi, winnerSide: "top" | "bot") => {
    const winnerParticipantId = Number((winnerSide === "top" ? m.top : m.bot)!.id)
    await send(m, { topScore: 0, botScore: 0, winnerParticipantId, forfeit: true })
  }

  // Elimination brackets are reported round by round: a semifinal can't be
  // entered until every quarterfinal is in. The earliest round of each such
  // bracket that still has an open match is the only reportable one; later
  // rounds wait. League/group/swiss aren't gated (order-free / engine-gated).
  const ELIM = ["winners", "losers", "grand"]
  const currentRound: Record<string, number> = {}
  const maxRound: Record<string, number> = {}
  for (const b of ELIM) {
    const inB = matches.filter((m) => m.bracket === b)
    if (!inB.length) continue
    maxRound[b] = Math.max(...inB.map((m) => m.roundNumber))
    const open = inB.filter((m) => m.status !== "completed" && m.status !== "bye")
    currentRound[b] = open.length ? Math.min(...open.map((m) => m.roundNumber)) : Infinity
  }
  const isLocked = (m: TnMatchApi) =>
    ELIM.includes(m.bracket) && m.roundNumber > (currentRound[m.bracket] ?? Infinity)

  const ready = matches.filter((m) => m.status === "ready" && m.top && m.bot)
  const reportable = ready.filter((m) => !isLocked(m))
  const waiting = ready.filter((m) => isLocked(m))
  // Resolved matches with two named sides can be corrected (the API guards
  // whether it is still safe to amend).
  const resolved = matches.filter((m) => m.status === "completed" && m.top && m.bot)

  const roundLabel = (m: TnMatchApi): string => {
    if (m.bracket === "grand") return "Gran final"
    if (m.bracket === "winners") {
      const fromEnd = (maxRound["winners"] ?? m.roundNumber) - m.roundNumber
      return ["Final", "Semifinales", "Cuartos", "Octavos"][fromEnd] ?? `Ronda ${m.roundNumber}`
    }
    if (m.bracket === "losers") return `Perdedores · ronda ${m.roundNumber}`
    if (m.bracket === "swiss") return `Ronda ${m.roundNumber}`
    return `Jornada ${m.roundNumber}`
  }

  // Group reportable matches by round (bracket precedence, then round order).
  const groups = new Map<string, { label: string; items: TnMatchApi[] }>()
  for (const m of reportable) {
    const key = `${m.bracket}#${m.roundNumber}`
    if (!groups.has(key)) groups.set(key, { label: roundLabel(m), items: [] })
    groups.get(key)!.items.push(m)
  }
  const bracketRank = (b: string) =>
    ["winners", "group", "league", "swiss", "losers", "grand"].indexOf(b)
  const orderedGroups = [...groups.entries()].sort(([ka], [kb]) => {
    const [ba, ra] = ka.split("#")
    const [bb, rb] = kb.split("#")
    return bracketRank(ba) - bracketRank(bb) || Number(ra) - Number(rb)
  })

  const setScore = (id: number, patch: Partial<{ a: string; b: string }>) =>
    setScores((cur) => {
      const base = cur[id] ?? { a: "", b: "" }
      return { ...cur, [id]: { ...base, ...patch } }
    })

  if (matches.length === 0) return null
  return (
    <Panel title={`Reportar resultados (${reportable.length} listos)`}>
      {reportable.length === 0 ? (
        <p className="py-2 font-mono text-[12px] text-txt-dim">
          {waiting.length > 0
            ? "Completa la ronda actual para desbloquear la siguiente."
            : "No hay partidas listas para reportar."}
        </p>
      ) : (
        <div className="grid gap-3">
          {orderedGroups.map(([key, g]) => (
            <div key={key} className="grid gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
                  {g.label} · {g.items.length}
                </span>
                <RoundScheduler tid={tid} items={g.items} onScheduled={onReported} />
              </div>
              {g.items.map((m) => {
                const s = scores[m.id] ?? { a: "", b: "" }
                const filled = s.a !== "" && s.b !== ""
                return (
                  <div key={m.id} className="flex flex-wrap items-center gap-2 border border-solid border-line bg-base px-2 py-1.5">
                    <span className="min-w-[80px] flex-1 truncate text-right font-body text-[12px]">{m.top?.name}</span>
                    <input type="number" min={0} value={s.a} onChange={(e) => setScore(m.id, { a: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" placeholder="–" />
                    <span className="font-mono text-[11px] text-txt-dim">–</span>
                    <input type="number" min={0} value={s.b} onChange={(e) => setScore(m.id, { b: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" placeholder="–" />
                    <span className="min-w-[80px] flex-1 truncate font-body text-[12px]">{m.bot?.name}</span>
                    <Button size="sm" disabled={!filled} onClick={() => report(m)}>OK</Button>
                    <button type="button" onClick={() => forfeit(m, "top")} className="border border-solid border-line px-1.5 py-0.5 font-mono text-[9px] uppercase text-txt-dim transition-colors hover:border-line-2 hover:text-txt" title={`Walkover a favor de ${m.top?.name}`}>W.O. ↑</button>
                    <button type="button" onClick={() => forfeit(m, "bot")} className="border border-solid border-line px-1.5 py-0.5 font-mono text-[9px] uppercase text-txt-dim transition-colors hover:border-line-2 hover:text-txt" title={`Walkover a favor de ${m.bot?.name}`}>W.O. ↓</button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {waiting.length > 0 && (
        <p className="mt-3 border-t border-dashed border-line pt-2 font-mono text-[10px] text-txt-dim">
          🔒 {waiting.length} partida{waiting.length === 1 ? "" : "s"} en rondas posteriores — se desbloquean al cerrar la ronda actual.
        </p>
      )}

      {(() => {
        const disputed = matches.filter((m) => m.proposalState === "disputed")
        if (!disputed.length) return null
        return (
          <div className="mt-3 border border-solid border-bad bg-bad-soft px-3 py-2 font-mono text-[11px] text-bad">
            ⚠ {disputed.length} partida{disputed.length === 1 ? "" : "s"} en disputa — revisa el chat de mesa y resuelve con el reporte manual.
          </div>
        )
      })()}

      {resolved.length > 0 && (
        <details className="mt-3 border-t border-dashed border-line pt-2">
          <summary className="cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-txt-dim">
            Corregir resultados ({resolved.length})
          </summary>
          <div className="mt-2 grid gap-1.5">
            {resolved.map((m) => {
              const editing = amendId === m.id
              const s = scores[m.id] ?? { a: "", b: "" }
              const filled = s.a !== "" && s.b !== ""
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-2 border border-solid border-line bg-base px-2 py-1.5">
                  <span className="min-w-[80px] flex-1 truncate text-right font-body text-[12px]">{m.top?.name}</span>
                  {editing ? (
                    <>
                      <input type="number" min={0} value={s.a} onChange={(e) => setScore(m.id, { a: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" />
                      <span className="font-mono text-[11px] text-txt-dim">–</span>
                      <input type="number" min={0} value={s.b} onChange={(e) => setScore(m.id, { b: e.target.value })} className="w-12 border border-line bg-panel px-1 py-0.5 text-center font-mono text-[12px]" />
                    </>
                  ) : (
                    <span className="font-mono text-[12px] text-txt-muted">{m.g1 ?? 0}–{m.g2 ?? 0}</span>
                  )}
                  <span className="min-w-[80px] flex-1 truncate font-body text-[12px]">{m.bot?.name}</span>
                  {editing ? (
                    <>
                      <Button size="sm" disabled={!filled} onClick={() => report(m, true)}>Guardar</Button>
                      <button type="button" onClick={() => setAmendId(null)} className="font-mono text-[10px] text-txt-dim hover:text-txt">cancelar</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => { setAmendId(m.id); setScore(m.id, { a: String(m.g1 ?? 0), b: String(m.g2 ?? 0) }) }} className="font-mono text-[10px] text-accent transition-opacity hover:opacity-70">corregir</button>
                  )}
                </div>
              )
            })}
          </div>
        </details>
      )}
    </Panel>
  )
}
