"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, toast } from "@boffmedia/ui"
import { AvPanel, AvPill } from "../../_components/ui/av-kit"
import { TournamentsService, type TnMatchApi } from "@/services/api/boffmedia/tournamentsService"
import { RoundScheduler } from "./PhasesEditor"

export function ReportPanel({
  tid,
  slug,
  bestOf,
  matches,
  onReported,
}: {
  tid: number
  slug: string
  bestOf: number
  matches: TnMatchApi[]
  onReported: () => void
}) {
  const t = useTranslations("tournaments")
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
    if (s.a === "" || s.b === "") return toast.error(t("resultRequired"))
    const a = +s.a
    const b = +s.b
    const winnerParticipantId = a === b ? undefined : a > b ? Number(m.top!.id) : Number(m.bot!.id)
    await send(m, { topScore: a, botScore: b, winnerParticipantId, amend })
  }

  const forfeit = async (m: TnMatchApi, winnerSide: "top" | "bot") => {
    const winnerParticipantId = Number((winnerSide === "top" ? m.top : m.bot)!.id)
    await send(m, { topScore: 0, botScore: 0, winnerParticipantId, forfeit: true })
  }

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
  const resolved = matches.filter((m) => m.status === "completed" && m.top && m.bot)

  const roundLabel = (m: TnMatchApi): string => {
    if (m.bracket === "grand") return t("roundLabel.grand")
    if (m.bracket === "winners") {
      const fromEnd = (maxRound["winners"] ?? m.roundNumber) - m.roundNumber
      return [t("roundLabel.final"), t("roundLabel.semis"), t("roundLabel.quarters"), t("roundLabel.eighths")][fromEnd] ?? t("roundLabel.swiss", { n: m.roundNumber })
    }
    if (m.bracket === "losers") return t("roundLabel.losers", { n: m.roundNumber })
    if (m.bracket === "swiss") return t("roundLabel.swiss", { n: m.roundNumber })
    return t("roundLabel.league", { n: m.roundNumber })
  }

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
  const disputed = matches.filter((m) => m.proposalState === "disputed")
  const judge = matches.filter((m) => m.judgeRequestedAt && m.proposalState !== "disputed")

  return (
    <div>
      {/* A disputed result or a judge request is someone waiting on staff, so
          it comes first and links straight through to the table. */}
      {(disputed.length > 0 || judge.length > 0) && (
        <AvPanel title={t("attention.title")} icon="alert" aside={<AvPill tone={disputed.length ? "rose" : "amber"}>{disputed.length + judge.length}</AvPill>}>
          <AttentionList slug={slug} title={t("reportDisputed", { count: disputed.length })} items={disputed} tone="bad" />
          <AttentionList slug={slug} title={t("judgeRequested", { count: judge.length })} items={judge} tone="warn" />
        </AvPanel>
      )}

      <AvPanel title={t("pendingTitle")} icon="play" aside={<AvPill tone={reportable.length ? "accent" : "muted"}>{reportable.length}</AvPill>}>
      {reportable.length === 0 ? (
        <p className="py-2 font-mono text-[12px] text-txt-dim">
          {waiting.length > 0
            ? t("reportWaiting")
            : t("reportNone")}
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
                    <button type="button" onClick={() => forfeit(m, "top")} className="border border-solid border-line px-1.5 py-0.5 font-mono text-[9px] uppercase text-txt-dim transition-colors hover:border-line-2 hover:text-txt" title={`W.O. ${m.top?.name}`}>W.O. ↑</button>
                    <button type="button" onClick={() => forfeit(m, "bot")} className="border border-solid border-line px-1.5 py-0.5 font-mono text-[9px] uppercase text-txt-dim transition-colors hover:border-line-2 hover:text-txt" title={`W.O. ${m.bot?.name}`}>W.O. ↓</button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {waiting.length > 0 && (
        <p className="mt-3 border-t border-dashed border-line pt-2 font-mono text-[10px] text-txt-dim">
          {t("reportLocked", { count: waiting.length })}
        </p>
      )}
      </AvPanel>

      {resolved.length > 0 && (
        <AvPanel title={t("resultsTitle")} icon="check" aside={<AvPill>{resolved.length}</AvPill>}>
          <div className="grid gap-1.5">
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
                      <Button size="sm" disabled={!filled} onClick={() => report(m, true)}>{t("save")}</Button>
                      <button type="button" onClick={() => setAmendId(null)} className="font-mono text-[10px] text-txt-dim hover:text-txt">{t("cancel")}</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => { setAmendId(m.id); setScore(m.id, { a: String(m.g1 ?? 0), b: String(m.g2 ?? 0) }) }} className="font-mono text-[10px] text-accent transition-opacity hover:opacity-70">{t("correct")}</button>
                  )}
                </div>
              )
            })}
          </div>
        </AvPanel>
      )}
    </div>
  )
}

/**
 * Matches that need a human: disputes and judge calls. Each row links to the
 * match page, which is where an admin can read the chat and settle it.
 */
function AttentionList({
  slug,
  title,
  items,
  tone,
}: {
  slug: string
  title: string
  items: TnMatchApi[]
  tone: "bad" | "warn"
}) {
  if (!items.length) return null
  return (
    <div className="[&+&]:mt-3">
      <p className={cn("m-0 mb-1.5 font-mono text-[11px] font-semibold", tone === "bad" ? "text-bad" : "text-warn")}>
        {title}
      </p>
      <div className="grid gap-1">
        {items.map((m) => (
          <a
            key={m.id}
            href={`/torneos/${slug}/partida/${m.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border border-solid border-line bg-base px-2 py-1 font-body text-[12px] transition-colors hover:border-accent-line"
          >
            <span className="min-w-0 flex-1 truncate text-right">{m.top?.name ?? "—"}</span>
            <span className="font-mono text-[10px] text-txt-dim">vs</span>
            <span className="min-w-0 flex-1 truncate">{m.bot?.name ?? "—"}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
