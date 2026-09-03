"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Button, toast, Input } from "@boffmedia/ui"
import { DkFlag, DkLive, DkSprite, DkType } from "@/components/boffmedia/ui/tools/datakit"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { TnCompetitor } from "./tournaments-util"

// Live self-report match table (LimitlessVGC model): round header, opponent card,
// BO3 report with rival verification + auto-verify, table chat with judge request,
// and the opponent teamsheet (Showdown export). Read-only demo data. [deferred]

export interface TmMon {
  id?: string
  slot?: number
  dex?: number
  name: string
  item: string
  ability?: string
  tera: string
  moves: string[]
}
export interface TmPlayer extends TnCompetitor {
  _pk?: TmMon[]
}
export interface TmComp {
  title: React.ReactNode
}

const abilityOf = (m: TmMon) => m.ability || "—"
const nowHM = () => {
  const d = new Date()
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")
}
const fmtMMSS = (s: number) => {
  const m = Math.floor(s / 60)
  const ss = s % 60
  return m + ":" + String(ss).padStart(2, "0")
}
function showdownPaste(team: TmMon[]) {
  return team
    .map((m) => [`${m.name} @ ${m.item}`, "Ability: " + abilityOf(m), "Level: 50", "Tera Type: " + m.tera, "- " + m.moves.join("\n- ")].join("\n"))
    .join("\n\n")
}
function copyText(text: string, msg: string) {
  try {
    navigator.clipboard.writeText(text)
  } catch {
    /* noop */
  }
  toast({ msg, icon: "check", tone: "ok" })
}

export const TM_CARD = "border border-solid border-line bg-panel cut-corner cut-corner-edge [--cut-lg:14px]"
export const TM_CARD_HEAD = "flex items-center justify-between gap-3 border-b border-solid border-line bg-panel-2 px-4 py-[0.8125rem]"
export const TM_CARD_H3 = "m-0 font-mono text-[0.8125rem]/none font-bold uppercase tracking-[0.12em] text-txt"
const CARD = TM_CARD
const CARD_HEAD = TM_CARD_HEAD
const CARD_H3 = TM_CARD_H3
const GHUE_BORDER = "border-l-[3px] border-l-[hsl(var(--ghue,28)_60%_50%)]"

export function TmRoundHeader({ comp, roundNo, tableNo, status, bestOf = 3, scheduledAt }: { comp: TmComp; roundNo: React.ReactNode; tableNo: React.ReactNode; status?: string; bestOf?: number; scheduledAt?: string | null }) {
  const t = useTranslations("common.tournaments")
  const { intlLocale } = useFormat()
  const chip = "inline-flex items-center gap-1.5 border border-solid border-line-2 px-[0.5625rem] py-[0.3125rem] font-mono text-[0.6875rem]/none font-semibold text-txt-muted [&_svg]:text-txt-dim"
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3.5 border border-solid border-line bg-panel px-[1.125rem] py-[0.9375rem] cut-corner cut-corner-edge [--cut-lg:14px]", GHUE_BORDER)}>
      <div>
        <span className="mb-[0.5625rem] block font-display text-[1.25rem]/[1.05] font-extrabold uppercase tracking-[0.02em]">{comp.title}</span>
        <div className="flex flex-wrap gap-2">
          <span className={chip}><Icon name="list" size={12} />{t("round")} {roundNo}</span>
          <span className={chip}><Icon name="grid" size={12} />{t("table")} {tableNo}</span>
          <span className="inline-flex items-center gap-1.5 border border-solid border-[hsl(var(--ghue,28)_60%_50%_/_0.4)] px-[0.5625rem] py-[0.3125rem] font-mono text-[0.6875rem]/none font-semibold text-[hsl(var(--ghue,28)_65%_62%)] [&_svg]:text-[hsl(var(--ghue,28)_65%_62%)]"><Icon name="trophy" size={12} />{t("bestOf", { count: bestOf })}</span>
          {scheduledAt && (
            <span className={chip}>
              <Icon name="clock" size={12} />
              {new Date(scheduledAt).toLocaleString(intlLocale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
      <DkLive status={status === "final" ? "final" : "live"} label={status === "final" ? t("finished") : t("inProgress")} />
    </div>
  )
}

export function TmOpponentCard({ opp, onChat, onTeam }: { opp: TmPlayer; onChat?: () => void; onTeam?: () => void }) {
  const t = useTranslations("common.tournaments")
  const rec = (opp.w || 0) + "-" + (opp.l || 0) + "-" + (opp.d || 0)
  const pts = opp.pts != null ? opp.pts : (opp.w || 0) * 3 + (opp.d || 0)
  const iconBtn = "grid h-7 w-7 place-items-center border border-solid border-line-2 bg-base text-txt-muted cursor-pointer transition-colors hover:border-accent-line hover:text-accent-bright"
  return (
    <section className={CARD}>
      <div className={CARD_HEAD}><h3 className={CARD_H3}>{t("youFace")}</h3></div>
      <div className="flex flex-wrap items-center justify-between gap-6 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <DkFlag flag={opp.flag} code={opp.country} name={opp.countryName} size={22} />
          <div className="grid min-w-0 gap-1">
            <div className="flex items-center gap-2">
              <b className="font-display text-[1.375rem]/none font-extrabold tracking-[0.01em]">{opp.name}</b>
              <button type="button" className={iconBtn} title={t("chatTableLink")} onClick={onChat}><Icon name="message" size={15} /></button>
              <button type="button" className={iconBtn} title={t("viewTeamSheet")} onClick={onTeam}><Icon name="list" size={15} /></button>
            </div>
            <span className="font-mono text-[0.75rem]/[1.3] font-medium text-txt-muted">{pts} pts · récord {rec} · {opp.countryName}</span>
          </div>
        </div>
        <div className="grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-1.5">
          <span className="col-start-1 font-mono text-[0.59375rem]/none font-bold uppercase tracking-[0.14em] text-txt-dim">{t("inGameName")}</span>
          <button type="button" className="col-start-2 inline-flex cursor-pointer items-center gap-1.5 justify-self-start border-0 bg-transparent p-0 font-mono text-[0.625rem]/none font-semibold text-info hover:text-accent-bright" onClick={() => copyText(opp.tag || "", t("nameCopied", { name: opp.tag || "" }))}>
            <Icon name="copy" size={12} />{t("copyName")}
          </button>
          <b className="col-span-2 font-display text-[1.5rem]/none font-extrabold tracking-[0.01em] text-txt">{opp.tag}</b>
        </div>
      </div>
    </section>
  )
}

const AUTO_VERIFY_SECONDS = 90

export function TmReportPanel({ opp, initialScenario, onSystem }: { me?: TmPlayer; opp: TmPlayer; initialScenario?: string; onSystem?: (text: string) => void }) {
  const t = useTranslations("common.tournaments")
  const [games, setGames] = React.useState<(string | null)[]>([null, null, null])
  const [phase, setPhase] = React.useState(initialScenario === "incoming" ? "incoming" : "edit")
  const [countdown, setCountdown] = React.useState(AUTO_VERIFY_SECONDS)
  const [autoVerified, setAutoVerified] = React.useState(false)
  const incomingGames = React.useMemo(() => ["L", "W", "L"], [])

  const wins = games.filter((g) => g === "W").length
  const losses = games.filter((g) => g === "L").length
  const decisive = wins >= 2 || losses >= 2
  const resultText = wins > losses ? `${t("victory")} ${wins}-${losses}` : losses > wins ? `${t("defeat")} ${losses}-${wins}` : `${t("verified")} ${wins}-${losses}`

  const setGame = (i: number, val: string) => {
    if (phase !== "edit") return
    setGames((g) => {
      const n = g.slice()
      n[i] = n[i] === val ? null : val
      return n
    })
  }
  const submit = () => {
    if (!decisive) return
    setPhase("awaiting")
    setCountdown(AUTO_VERIFY_SECONDS)
    onSystem?.(t("reportSubmitted", { wins, losses, name: opp.name }))
    setTimeout(() => {
      setPhase((cur) => {
        if (cur !== "awaiting") return cur
        onSystem?.(t("reportConfirmed", { name: opp.name }))
        return "verified"
      })
    }, 6500)
  }
  const verifyIncoming = (agree: boolean) => {
    if (agree) {
      setGames(incomingGames)
      setPhase("verified")
      onSystem?.(t("resultVerifiedByYou", { name: opp.name }))
    } else {
      setPhase("dispute")
      onSystem?.(t("resultRejected"))
    }
  }
  React.useEffect(() => {
    if (phase !== "awaiting") return
    if (countdown <= 0) {
      setAutoVerified(true)
      setPhase("verified")
      onSystem?.(t("autoVerificationApplied"))
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, countdown])

  const locked = phase !== "edit"
  const shown = phase === "incoming" ? incomingGames : games
  const pill = "inline-flex items-center gap-1.5 border border-solid px-[0.5625rem] py-[0.3125rem] font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.06em]"
  const gbtn = "flex-1 cursor-pointer border border-solid border-line-2 bg-base px-2 py-[0.6875rem] font-body text-[0.8125rem]/none font-semibold text-txt-muted transition-colors enabled:hover:border-txt-muted enabled:hover:text-txt disabled:cursor-default"
  const banner = "m-4 flex items-center gap-[0.6875rem] p-[0.875rem] font-body text-[0.8125rem]/[1.45] [&>b]:font-bold"

  return (
    <section className={CARD}>
      <div className={CARD_HEAD}>
        <h3 className={CARD_H3}>{t("reportGames")}</h3>
        {phase === "verified" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok")}><Icon name="check" size={12} />{t("verifiedStatus")}</span>}
        {phase === "awaiting" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn")}><Icon name="clock" size={12} />{t("awaitingConfirmation")}</span>}
        {phase === "dispute" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad")}><Icon name="alert" size={12} />{t("inDispute")}</span>}
        {phase === "incoming" && <span className={cn(pill, "border-[color:color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn")}><Icon name="clock" size={12} />{t("yourTurnToVerify")}</span>}
      </div>

      {phase === "incoming" && (
        <div className={cn(banner, "text-info bg-info-soft border border-solid border-[color:color-mix(in_srgb,var(--info)_40%,transparent)]")}>
          <Icon name="info" size={15} className="flex-none" />
          <span>{t("incomingBanner", { name: opp.name })}</span>
        </div>
      )}

      <div className={cn("grid gap-2.5 p-4", locked && "[&_button:not(.on)]:opacity-40")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-[5.625rem_1fr] items-center gap-4 max-[760px]:grid-cols-[4.375rem_1fr]">
            <span className="text-right font-mono text-[0.75rem]/none font-bold uppercase tracking-[0.06em] text-txt-muted">{t("game")} {i + 1}</span>
            <div className="flex max-w-[18.75rem] gap-2.5">
              <button type="button" disabled={locked} onClick={() => setGame(i, "W")} className={cn(gbtn, shown[i] === "W" && "on border-ok bg-ok-soft text-ok")}>{t("victory")}</button>
              <button type="button" disabled={locked} onClick={() => setGame(i, "L")} className={cn(gbtn, shown[i] === "L" && "on border-bad bg-bad-soft text-bad")}>{t("defeat")}</button>
            </div>
          </div>
        ))}
      </div>

      {phase === "edit" && (
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line bg-base px-4 py-3.5">
          <span className={cn("font-body text-[0.875rem]/[1.3]", decisive ? "font-bold text-txt" : "text-txt-dim")}>{decisive ? resultText : t("markEachGameResult")}</span>
          <Button variant="pri" size="sm" icon="check" disabled={!decisive} onClick={submit}>{t("submitReport")}</Button>
        </div>
      )}

      {phase === "awaiting" && (
        <div className="grid gap-[0.5625rem] border-t border-solid border-line bg-base px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <span className="font-body text-[0.875rem]/[1.3] font-bold text-txt">{resultText}</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.75rem]/none text-warn"><Icon name="clock" size={12} />{t("autoVerificationCountdown")} <b className="font-bold">{fmtMMSS(countdown)}</b></span>
          </div>
          <div className="h-1 overflow-hidden bg-line"><i className="block h-full bg-warn transition-[width] duration-1000 ease-linear" style={{ width: (countdown / AUTO_VERIFY_SECONDS) * 100 + "%" }} /></div>
          <p className="m-0 max-w-[68ch] font-body text-[0.71875rem]/[1.5] text-txt-muted">{t("reportAppearsInstantly", { name: opp.name })}</p>
        </div>
      )}

      {phase === "incoming" && (
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line bg-base px-4 py-3.5">
          <span className="font-body text-[0.875rem]/[1.3] font-bold text-txt">{t("accordingTo", { name: opp.name, losses: incomingGames.filter((g) => g === "L").length, wins: incomingGames.filter((g) => g === "W").length })}</span>
          <span className="inline-flex gap-2.5">
            <Button variant="ghost" size="sm" icon="alert" onClick={() => verifyIncoming(false)}>{t("dispute")}</Button>
            <Button variant="pri" size="sm" icon="check" onClick={() => verifyIncoming(true)}>{t("verify")}</Button>
          </span>
        </div>
      )}

      {phase === "verified" && (
        <div className={cn(banner, "text-ok bg-ok-soft border border-solid border-[color:color-mix(in_srgb,var(--ok)_40%,transparent)]")}>
          <Icon name="check" size={16} className="flex-none" />
          <span><b>{t("resultVerified", { wins: Math.max(wins, losses), losses: Math.min(wins, losses) })}.</b> {autoVerified ? t("autoVerifiedByTimeout") : t("confirmedByBoth")}</span>
        </div>
      )}
      {phase === "dispute" && (
        <div className={cn(banner, "text-bad bg-bad-soft border border-solid border-[color:color-mix(in_srgb,var(--bad)_40%,transparent)]")}>
          <Icon name="alert" size={16} className="flex-none" />
          <span><b>{t("resultInDispute")}</b> {t("judgeWillReview")}</span>
        </div>
      )}
    </section>
  )
}

type ChatMsg = { k: "sys" | "me" | "them" | "judge"; t: string; text: string }

function TmMatchChat({ me, opp, feed }: { me: TmPlayer; opp: TmPlayer; feed: string[] }) {
  const t = useTranslations("common.tournaments")
  const [msgs, setMsgs] = React.useState<ChatMsg[]>(() => [
    { k: "sys", t: "16:30", text: t("tableOpen") },
    { k: "them", t: "16:31", text: "¡Hola! ¿Listo cuando quieras?" },
    { k: "me", t: "16:31", text: "¡Listo! Mi ID: " + me.tag },
    { k: "them", t: "16:31", text: "Genial, te reto ahora." },
  ])
  const [judge, setJudge] = React.useState(false)
  const [input, setInput] = React.useState("")
  const bodyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (feed && feed.length) {
      setMsgs((m) => {
        const have = new Set(m.filter((x) => x.k === "sys").map((x) => x.text))
        const add = feed.filter((f) => !have.has(f)).map((text) => ({ k: "sys" as const, t: nowHM(), text }))
        return add.length ? m.concat(add) : m
      })
    }
  }, [feed])
  React.useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const send = () => {
    const v = input.trim()
    if (!v) return
    setMsgs((m) => m.concat({ k: "me", t: nowHM(), text: v }))
    setInput("")
  }
  const requestJudge = () => {
    if (judge) return
    setJudge(true)
    setMsgs((m) => m.concat({ k: "sys", t: nowHM(), text: t("judgeRequested") }, { k: "judge", t: nowHM(), text: t("judgeIntroduction") }))
  }

  return (
    <section className={CARD}>
      <div className={CARD_HEAD}>
        <h3 className={CARD_H3}>{t("tableChat")}</h3>
        <Button variant="default" size="sm" icon="alert" disabled={judge} onClick={requestJudge} className={cn(!judge && "border-warn text-warn hover:border-warn hover:bg-warn hover:text-white")}>
          {judge ? t("judgeNotified") : t("requestJudge")}
        </Button>
      </div>
      <div ref={bodyRef} className="flex h-[20rem] flex-col gap-2.5 overflow-y-auto bg-base p-4">
        {msgs.map((m, i) => {
          if (m.k === "sys")
            return (
              <div key={i} className="mx-auto inline-flex max-w-[82%] items-center gap-2 border border-solid border-[color:color-mix(in_srgb,var(--info)_25%,transparent)] bg-info-soft px-3 py-1.5 text-center font-body text-[0.71875rem]/[1.3] font-medium text-txt-muted">
                <span className="font-mono text-[0.625rem]/none font-semibold text-info">{m.t}</span>
                {m.text}
              </div>
            )
          const who = m.k === "me" ? me.name : m.k === "judge" ? "Álex · juez" : opp.name
          return (
            <div key={i} className={cn("flex max-w-[82%]", m.k === "me" ? "self-end" : "self-start")}>
              <div className={cn("grid gap-[3px] border border-solid px-3 py-2", m.k === "me" ? "border-accent-line bg-accent-soft" : m.k === "judge" ? "border-[color:color-mix(in_srgb,var(--warn)_35%,transparent)] bg-warn-soft" : "border-line bg-panel-2")}>
                <div className="flex items-baseline gap-2">
                  <b className={cn("font-mono text-[0.6875rem]/none font-bold", m.k === "me" ? "text-accent-bright" : m.k === "judge" ? "text-warn" : "text-txt")}>{who}</b>
                  <i className="font-mono text-[0.625rem]/none not-italic text-txt-dim">{m.t}</i>
                </div>
                <p className="m-0 break-words font-body text-[0.84375rem]/[1.45] text-txt">{m.text}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2.5 border-t border-solid border-line bg-panel px-4 py-3">
        <Input
          size="sm"
          className="min-w-0 flex-1"
          value={input}
          placeholder={t("tableChatPlaceholder")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send() }}
        />
        <Button variant="pri" size="sm" icon="arrow" onClick={send}>{t("send")}</Button>
      </div>
    </section>
  )
}

export function TmMonCard({ mon }: { mon: TmMon }) {
  const t = useTranslations("common.tournaments")
  return (
    <div className="grid border border-solid border-line bg-base">
      <div className="flex items-center gap-[0.5625rem] border-b border-solid border-[hsl(var(--ghue,28)_55%_46%_/_0.32)] bg-[hsl(var(--ghue,28)_55%_46%_/_0.16)] px-[0.6875rem] py-2">
        <DkSprite alt={mon.name} size={40} />
        <b className="min-w-0 flex-1 truncate font-display text-[0.875rem]/[1.05] font-bold tracking-[0.01em]">{mon.name}</b>
        <span className="inline-flex items-center gap-1.5">
          <i className="font-mono text-[0.53125rem]/none font-semibold uppercase not-italic tracking-[0.08em] text-txt-dim">Tera</i>
          <DkType type={mon.tera} small />
        </span>
      </div>
      <div className="grid gap-1.5 border-b border-solid border-line px-3 py-2.5">
        <span className="grid grid-cols-[4.25rem_1fr] gap-2 font-body text-[0.75rem]/[1.3] text-txt"><i className="self-center font-mono text-[0.53125rem]/[1.4] font-semibold uppercase not-italic tracking-[0.08em] text-txt-dim">{t("item")}</i>{mon.item}</span>
        <span className="grid grid-cols-[4.25rem_1fr] gap-2 font-body text-[0.75rem]/[1.3] text-txt"><i className="self-center font-mono text-[0.53125rem]/[1.4] font-semibold uppercase not-italic tracking-[0.08em] text-txt-dim">{t("ability")}</i>{abilityOf(mon)}</span>
      </div>
      <ul className="m-0 grid list-none gap-1.5 p-3">
        {mon.moves.map((mv) => (
          <li key={mv} className="flex items-center gap-2 font-body text-[0.78125rem]/[1.2] font-medium text-txt-muted">
            <span className="h-1 w-1 flex-none rotate-45 bg-[hsl(var(--ghue,28)_60%_55%)]" />
            {mv}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TmTeamsheet({ opp, onCalc }: { opp: TmPlayer; onCalc?: () => void }) {
  const t = useTranslations("common.tournaments")
  const tTeamsheet = useTranslations("torneos.teamsheet")
  const team = opp._pk || []
  if (!team.length) return null
  return (
    <section className={CARD}>
      <div className={CARD_HEAD}>
        <h3 className={CARD_H3}>{t("teamSheet", { name: opp.name })}</h3>
        <span className="inline-flex gap-2.5">
          <Button variant="default" size="sm" icon="calc" onClick={onCalc}>{t("damageCalc")}</Button>
          <Button variant="pri" size="sm" icon="copy" onClick={() => copyText(showdownPaste(team), t("copiedShowdown"))}>{t("copyTeam")}</Button>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 p-4 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
        {team.map((m) => <TmMonCard key={m.slot != null ? m.slot : m.id || m.name} mon={m} />)}
      </div>
      <p className="m-0 flex items-center gap-2 px-4 pb-4 font-body text-[0.71875rem]/[1.5] text-txt-muted [&_svg]:flex-none [&_svg]:text-txt-dim">
        <Icon name="info" size={12} />{tTeamsheet("viewerHint")}
      </p>
    </section>
  )
}

export function TmMatchView({ comp, me, opp, roundNo, tableNo, status, scenario, onCalc, standalone }: { comp: TmComp; me: TmPlayer; opp: TmPlayer; roundNo: React.ReactNode; tableNo: React.ReactNode; status?: string; scenario?: string; onCalc?: () => void; standalone?: boolean }) {
  const [feed, setFeed] = React.useState<string[]>([])
  const pushSystem = (text: string) => setFeed((f) => f.concat(text))
  const teamRef = React.useRef<HTMLDivElement>(null)
  const chatRef = React.useRef<HTMLDivElement>(null)
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    const el = ref.current
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" })
  }
  return (
    <div className={cn("grid max-w-[58.75rem] gap-3.5", standalone && "mx-auto")}>
      <TmRoundHeader comp={comp} roundNo={roundNo} tableNo={tableNo} status={status} />
      <TmOpponentCard opp={opp} onChat={() => scrollTo(chatRef)} onTeam={() => scrollTo(teamRef)} />
      <TmReportPanel me={me} opp={opp} initialScenario={scenario} onSystem={pushSystem} />
      <div ref={chatRef}><TmMatchChat me={me} opp={opp} feed={feed} /></div>
      <div ref={teamRef}><TmTeamsheet opp={opp} onCalc={onCalc} /></div>
    </div>
  )
}
