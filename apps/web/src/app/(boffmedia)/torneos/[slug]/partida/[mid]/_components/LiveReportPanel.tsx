"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon, toast } from "@boffmedia/ui"
import { TM_CARD, TM_CARD_HEAD, TM_CARD_H3 } from "@/components/boffmedia/ui/tournaments"
import { TournamentsService, type TnMatchDetailApi } from "@/services/api/boffmedia/tournamentsService"

type PanelPhase = "edit" | "awaiting" | "incoming" | "verified" | "dispute"

export function LiveReportPanel({
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
  const t = useTranslations("torneos.report")
  const bestOf = Math.max(1, detail.bestOf)
  const majority = Math.ceil(bestOf / 2)
  const [games, setGames] = React.useState<(string | null)[]>(() => Array(bestOf).fill(null))
  const [busy, setBusy] = React.useState(false)
  // Closes the double-click window that `busy` alone leaves open.
  const inFlight = React.useRef(false)
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
    wins > losses ? t("resultWin", { w: wins, l: losses }) : losses > wins ? t("resultLoss", { l: losses, w: wins }) : t("resultNone")

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
    // `busy` is state and updates asynchronously, so two fast clicks both see
    // false; the ref closes that window. Duplicate proposals need a judge.
    if (!decisive || busy || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    const str = games.filter((g): g is string => g != null).join("")
    const r = await TournamentsService.propose(detail.tournamentId, detail.id, str)
    setBusy(false)
    inFlight.current = false
    if (r.error) toast.error(r.error)
    else onChanged()
  }
  const verdict = async (accept: boolean) => {
    if (busy || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    const r = await TournamentsService.confirm(detail.tournamentId, detail.id, accept)
    setBusy(false)
    inFlight.current = false
    if (r.error) toast.error(r.error)
    else onChanged()
  }

  const pill = "inline-flex items-center gap-1.5 border border-solid px-[0.5625rem] py-[0.3125rem] font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.06em]"
  const gbtn = "flex-1 cursor-pointer border border-solid border-line-2 bg-base px-2 py-[0.6875rem] font-body text-[0.8125rem]/none font-semibold text-txt-muted transition-colors enabled:hover:border-txt-muted enabled:hover:text-txt disabled:cursor-default"
  const banner = "m-4 flex items-center gap-[0.6875rem] p-[0.875rem] font-body text-[0.8125rem]/[1.45] [&>b]:font-bold"
  const locked = phase !== "edit"

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>{t("title")}</h3>
        {phase === "verified" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok")}><Icon name="check" size={12} />{t("phaseVerified")}</span>}
        {phase === "awaiting" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn")}><Icon name="clock" size={12} />{t("phaseAwaiting")}</span>}
        {phase === "dispute" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad")}><Icon name="alert" size={12} />{t("phaseDispute")}</span>}
        {phase === "incoming" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn")}><Icon name="clock" size={12} />{t("phaseIncoming")}</span>}
      </div>

      {phase === "incoming" && (
        <div className={cn(banner, "text-info bg-info-soft border border-solid border-[color:color-mix(in_srgb,var(--info)_40%,transparent)]")}>
          <Icon name="info" size={15} className="flex-none" />
          <span><b>{oppName}</b> {t("incomingInfo")}</span>
        </div>
      )}

      <div className={cn("grid gap-2.5 p-4", locked && "[&_button:not(.on)]:opacity-40")}>
        {Array.from({ length: bestOf }, (_, i) => (
          <div key={i} className="grid grid-cols-[5.625rem_1fr] items-center gap-4 max-[760px]:grid-cols-[4.375rem_1fr]">
            <span className="text-right font-mono text-[0.75rem]/none font-bold uppercase tracking-[0.06em] text-txt-muted">{t("gameLabel", { n: i + 1 })}</span>
            <div className="flex max-w-[18.75rem] gap-2.5">
              <button type="button" disabled={locked} onClick={() => setGame(i, "W")} className={cn(gbtn, shown[i] === "W" && "on border-ok bg-ok-soft text-ok")}>{t("win")}</button>
              <button type="button" disabled={locked} onClick={() => setGame(i, "L")} className={cn(gbtn, shown[i] === "L" && "on border-bad bg-bad-soft text-bad")}>{t("loss")}</button>
            </div>
          </div>
        ))}
      </div>

      {phase === "edit" && (
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line bg-base px-4 py-3.5">
          <span className={cn("font-body text-[0.875rem]/[1.3]", decisive ? "font-bold text-txt" : "text-txt-dim")}>{decisive ? resultText : t("footerHint")}</span>
          <Button variant="pri" size="sm" icon="check" disabled={!decisive || busy} onClick={submit}>{t("submit")}</Button>
        </div>
      )}

      {phase === "awaiting" && proposal && (
        <AwaitingFoot expiresAt={proposal.expiresAt} oppName={oppName} mine={gamesLabel(proposal.games)} onExpired={onChanged} />
      )}

      {phase === "incoming" && proposal && (
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line bg-base px-4 py-3.5">
          <span className="font-body text-[0.875rem]/[1.3] font-bold text-txt">
            {t("incomingScore", { oppName, score: `${gamesToMyScore(proposal.games, false)}-${gamesToMyScore(proposal.games, true)}` })}
          </span>
          <span className="inline-flex gap-2.5">
            <Button variant="ghost" size="sm" icon="alert" disabled={busy} onClick={() => verdict(false)}>{t("dispute")}</Button>
            <Button variant="pri" size="sm" icon="check" disabled={busy} onClick={() => verdict(true)}>{t("verify")}</Button>
          </span>
        </div>
      )}

      {phase === "verified" && (
        <div className={cn(banner, "text-ok bg-ok-soft border border-solid border-[color:color-mix(in_srgb,var(--ok)_40%,transparent)]")}>
          <Icon name="check" size={16} className="flex-none" />
          <span><b>{t("verifiedScore", { score: `${Math.max(myFinal, oppFinal)}-${Math.min(myFinal, oppFinal)}` })}</b> {iWon ? t("verifiedWin") : t("verifiedLoss")}</span>
        </div>
      )}
      {phase === "dispute" && (
        <div className={cn(banner, "text-bad bg-bad-soft border border-solid border-[color:color-mix(in_srgb,var(--bad)_40%,transparent)]")}>
          <Icon name="alert" size={16} className="flex-none" />
          <span><b>{t("disputeTitle")}</b> {t("disputeBody")}</span>
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
  const t = useTranslations("torneos.report")
  const total = React.useRef<number |null>(null)
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
  }, [expiresAt])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  return (
    <div className="grid gap-[0.5625rem] border-t border-solid border-line bg-base px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <span className="font-body text-[0.875rem]/[1.3] font-bold text-txt">{t("awaitingReported", { score: mine })}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.75rem]/none text-warn">
          <Icon name="clock" size={12} />{t("awaitingCountdownLabel")} <b className="font-bold">{fmt(left)}</b>
        </span>
      </div>
      <div className="h-1 overflow-hidden bg-line">
        <i className="block h-full bg-warn transition-[width] duration-1000 ease-linear" style={{ width: `${(left / (total.current || 1)) * 100}%` }} />
      </div>
      <p className="m-0 max-w-[68ch] font-body text-[0.71875rem]/[1.5] text-txt-muted">
        {t("awaitingNote", { oppName })}
      </p>
    </div>
  )
}
