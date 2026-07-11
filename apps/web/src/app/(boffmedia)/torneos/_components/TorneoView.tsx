"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { DkBracket, DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import {
  TnBracketMatch,
  TnDoubleBracket,
  TnGroupCard,
  TnLeagueTable,
  TnCrosstable,
  TnLeaderboard,
  TnEntrant,
  type TnStanding,
} from "@/components/boffmedia/ui/tournaments"
import type {
  TournamentDetailApi,
  TnPhaseApi,
  TnAdvanceRuleApi,
  TnViewApi,
  TnFormat,
  TnStandingApi,
} from "@/services/api/boffmedia/tournamentsService"
import * as A from "../_lib/adapt"

export function TorneoView({ detail }: { detail: TournamentDetailApi }) {
  const phases = detail.phases ?? []
  const single = phases.length <= 1
  const [activeId, setActiveId] = useState<number>(
    detail.activePhaseId ?? phases[0]?.id ?? 0,
  )

  // Single-phase (incl. every legacy tournament) renders exactly as before, from
  // the tournament format + the legacy `view`.
  if (single) {
    return (
      <PhaseBody
        format={detail.format}
        view={phases[0]?.view ?? detail.view}
        champion={A.comp(detail.champion)}
        phase={phases[0] ?? null}
      />
    )
  }

  const active =
    phases.find((p) => p.id === activeId) ??
    phases.find((p) => p.status === "live") ??
    phases[phases.length - 1]

  return (
    <div className="grid gap-4">
      <DkSeg
        size="sm"
        value={String(active.id)}
        onChange={(v) => setActiveId(Number(v))}
        ariaLabel="Fase del torneo"
        options={phases.map((p) => ({
          value: String(p.id),
          label: p.name,
        }))}
      />
      <PhaseBody
        format={active.format}
        view={active.view}
        champion={A.comp(detail.champion)}
        phase={active}
      />
    </div>
  )
}

function PhaseBody({
  format,
  view,
  champion,
  phase,
}: {
  format: TnFormat
  view: TnViewApi
  champion: ReturnType<typeof A.comp>
  phase: TnPhaseApi | null
}) {
  switch (format) {
    case "single":
      return (
        <Scroll>
          <DkBracket
            rounds={A.bracketRounds(view.rounds)}
            renderMatch={(m) => <TnBracketMatch m={m} champion={champion} />}
          />
        </Scroll>
      )
    case "double":
      return (
        <TnDoubleBracket
          d={{
            winners: A.bracketRounds(view.winners),
            losers: A.bracketRounds(view.losers),
            grandFinal: view.grandFinal ? A.match(view.grandFinal) : null,
            champion,
          }}
        />
      )
    case "roundrobin":
      return <LeagueBlock view={view} />
    case "groups":
      return <GroupsBlock view={view} champion={champion} />
    case "swiss":
      return <SwissBlock view={view} phase={phase} />
    case "leaderboard":
      return <TnLeaderboard lb={A.leaderboard(view)} />
    default:
      return null
  }
}

function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>
}

function LeagueBlock({ view }: { view: TnViewApi }) {
  const [seg, setSeg] = useState<"table" | "cross">("table")
  const league = A.league(view)
  return (
    <div className="grid gap-3">
      <DkSeg
        size="sm"
        value={seg}
        onChange={(v) => setSeg(v as "table" | "cross")}
        ariaLabel="Vista de liga"
        options={[
          { value: "table", label: "Tabla" },
          { value: "cross", label: "Crosstable" },
        ]}
      />
      {seg === "table" ? (
        <TnLeagueTable league={league} />
      ) : (
        <Scroll>
          <TnCrosstable crosstable={league.crosstable} />
        </Scroll>
      )}
    </div>
  )
}

function GroupsBlock({
  view,
  champion,
}: {
  view: TnViewApi
  champion: ReturnType<typeof A.comp>
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {(view.groups ?? []).map((g) => (
          <TnGroupCard key={g.id} group={A.group(g)} advance={g.advance} />
        ))}
      </div>
      {view.knockout && (
        <Scroll>
          <DkBracket
            rounds={A.bracketRounds(view.knockout.rounds)}
            renderMatch={(m) => <TnBracketMatch m={m} champion={champion} />}
          />
        </Scroll>
      )}
    </div>
  )
}

/**
 * Which competitors clear the phase's advancement rule. The standings arrive
 * already ordered by the phase's tiebreak profile, so this mirrors the engine's
 * `selectQualifiers` exactly (byes counted as wins, no losses).
 */
function qualifiedIds(
  standings: TnStandingApi[],
  advance: TnAdvanceRuleApi | null,
): Set<string> {
  if (!advance || advance.type === "all")
    return new Set(standings.map((s) => s.c.id))
  if (advance.type === "top_n")
    return new Set(
      standings.slice(0, advance.count ?? standings.length).map((s) => s.c.id),
    )
  // record: everyone at ≤ maxLosses, optionally capped by standings order.
  const cap = advance.maxLosses ?? Number.MAX_SAFE_INTEGER
  let elig = standings.filter((s) => s.l <= cap)
  if (advance.count != null) elig = elig.slice(0, advance.count)
  return new Set(elig.map((s) => s.c.id))
}

function SwissBlock({
  view,
  phase,
}: {
  view: TnViewApi
  phase: TnPhaseApi | null
}) {
  const rows = view.standings ?? []
  const advance = phase?.advance ?? null
  const qualified = qualifiedIds(rows, advance)
  const completed = phase?.status === "completed"
  // Index of the last qualifying row (in display order) → cut-line position.
  let lastCut = -1
  rows.forEach((s, i) => {
    if (qualified.has(s.c.id)) lastCut = i
  })

  return (
    <div className="grid gap-4">
      <SwissStandings
        rows={rows}
        qualified={qualified}
        lastCutIndex={advance ? lastCut : -1}
        dimEliminated={completed}
        advance={advance}
      />
      {(view.rounds ?? []).length > 0 && (
        <Scroll>
          <DkBracket
            rounds={A.bracketRounds(view.rounds)}
            renderMatch={(m) => <TnBracketMatch m={m} champion={null} />}
          />
        </Scroll>
      )}
    </div>
  )
}

function SwissStandings({
  rows,
  qualified,
  lastCutIndex,
  dimEliminated,
  advance,
}: {
  rows: TnStandingApi[]
  qualified: Set<string>
  lastCutIndex: number
  dimEliminated: boolean
  advance: TnAdvanceRuleApi | null
}) {
  const th =
    "px-2 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-txt-dim"
  const td = "px-2 py-2 align-middle"
  const cutLabel =
    advance?.type === "record"
      ? `Corte · ${advance.maxLosses ?? 0} derrotas`
      : advance?.type === "top_n"
        ? `Corte · top ${advance.count ?? ""}`
        : "Corte"

  return (
    <div className="overflow-x-auto border border-solid border-line bg-panel">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={cn(th, "w-8 text-center")}>#</th>
            <th className={th}>Competidor</th>
            <th className={cn(th, "text-center")}>PJ</th>
            <th className={cn(th, "text-center text-accent-bright")}>V-D</th>
            <th className={cn(th, "text-center")}>V-E-D</th>
            <th className={cn(th, "text-right")}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const isQ = qualified.has(s.c.id)
            const dim = dimEliminated && !isQ
            const row = (
              <tr
                key={s.c.id}
                className={cn(
                  "border-b border-line last:border-b-0 transition-opacity",
                  dim && "opacity-40",
                )}
              >
                <td className={cn(td, "text-center font-mono text-[12px] text-txt-muted")}>
                  {s.rank}
                </td>
                <td className={td}>
                  <TnEntrant c={A.standing(s).c} />
                </td>
                <td className={cn(td, "text-center font-mono text-[12px]")}>{s.played}</td>
                <td
                  className={cn(
                    td,
                    "text-center font-mono text-[13px] font-bold",
                    isQ ? "text-accent-bright" : "text-txt-muted",
                  )}
                >
                  {s.w}-{s.l}
                </td>
                <td className={cn(td, "text-center font-mono text-[11px] text-txt-dim")}>
                  {s.w}-{s.d}-{s.l}
                </td>
                <td className={cn(td, "text-right font-mono text-[12px] text-txt-muted")}>
                  {s.pts}
                </td>
              </tr>
            )
            // Draw the cut line right after the last qualifying row.
            if (i === lastCutIndex && i < rows.length - 1) {
              return [
                row,
                <tr key={`cut-${s.c.id}`} aria-hidden>
                  <td colSpan={6} className="p-0">
                    <div className="flex items-center gap-2 bg-accent-line/10 px-2 py-[3px]">
                      <span className="h-px flex-1 bg-accent-line" />
                      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-accent-bright">
                        {cutLabel}
                      </span>
                      <span className="h-px flex-1 bg-accent-line" />
                    </div>
                  </td>
                </tr>,
              ]
            }
            return row
          })}
        </tbody>
      </table>
    </div>
  )
}
