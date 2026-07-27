"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { DkBracket, DkFlag, DkLive, type DkBracketRound } from "@/components/boffmedia/ui/tools/datakit"
import { TnAvatar } from "./TnEntrant"
import type { TnCompetitor, TnMatch } from "./tournaments-util"

// Bracket seat/cross over the shared DkBracket layout. `.tn-bm`
export function TnBracketMatch({
  m,
  onOpen,
  champion,
  hi,
  reset,
}: {
  m: TnMatch
  onOpen?: (id: string) => void
  champion?: TnCompetitor | null
  hi?: Set<string> | null
  reset?: boolean
}) {
  const t = useTranslations("torneos.bracket")
  const hot = (p: TnCompetitor | null) => !!(hi && hi.size && p && p.country && hi.has(p.country))
  const cold = (p: TnCompetitor | null) => !!(hi && hi.size && (!p || !p.country || !hi.has(p.country)))
  const isChamp = !!champion && m.winner === champion
  const seat = (p: TnCompetitor | null, isWin: boolean, g: number, seed?: number | null) => (
    <button
      type="button"
      disabled={!p || !onOpen}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 border-0 bg-transparent px-[10px] py-2 text-left font-body text-[12.5px]/[1.2] font-semibold text-txt transition-[background] duration-[140ms] enabled:cursor-pointer enabled:hover:bg-panel-2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-line disabled:cursor-default",
        isWin && "text-ok",
        m.winner && !isWin && p && "text-txt-dim",
        hot(p) && "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
        cold(p) && "opacity-45",
      )}
      onClick={() => p && onOpen && onOpen(p.id)}
    >
      <span className="flex-none border border-solid border-line-2 px-1 py-0.5 font-mono text-[9px]/none font-bold text-txt-dim">{seed != null ? seed : "—"}</span>
      {p ? (
        <>
          {p.kind === "team" ? <TnAvatar c={p} size={17} /> : <DkFlag flag={p.flag} code={p.country} name={p.countryName} size={13} />}
          <span className="min-w-0 flex-1 truncate">{p.name}</span>
        </>
      ) : (
        <span className="min-w-0 flex-1 truncate italic text-txt-dim">{t("tbd")}</span>
      )}
      <span className="flex-none font-mono text-[12px]/none font-bold">{m.status === "final" ? g : ""}</span>
    </button>
  )
  const gA = Math.max(m.g1 || 0, m.g2 || 0)
  const gB = Math.min(m.g1 || 0, m.g2 || 0)
  const gTop = m.winner ? (m.winner === m.top ? gA : gB) : 0
  const gBot = m.winner ? (m.winner === m.bot ? gA : gB) : 0
  return (
    <div
      className={cn(
        "border border-solid border-line bg-panel",
        m.status === "playing" && "border-[color:color-mix(in_srgb,var(--warn)_45%,var(--line))]",
        isChamp && "border-[color:color-mix(in_srgb,var(--warn)_65%,var(--line))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--warn)_35%,transparent)]",
        m.bracket === "gf" && "border-accent-line",
      )}
    >
      {seat(m.top, m.winner === m.top, gTop, m.topSeed)}
      <div className="flex min-h-[4px] items-center justify-center border-y border-dashed border-line py-0.5">
        {m.status !== "final" && m.top && m.bot ? (
          <DkLive status={m.status} size="sm" />
        ) : reset ? (
          <span className="p-0.5 font-mono text-[8px]/none font-bold uppercase tracking-[0.1em] text-accent-bright">reset</span>
        ) : null}
      </div>
      {seat(m.bot, m.winner === m.bot, gBot, m.botSeed)}
    </div>
  )
}

export interface TnDoubleData {
  winners: DkBracketRound<TnMatch>[]
  losers: DkBracketRound<TnMatch>[]
  grandFinal?: (TnMatch & { reset?: boolean }) | null
  champion?: TnCompetitor | null
}

// Double-elimination: winners + losers brackets and a grand final. `.tn-double`
export function TnDoubleBracket({ d, onOpen, hi }: { d: TnDoubleData; onOpen?: (id: string) => void; hi?: Set<string> | null }) {
  const t = useTranslations("torneos.bracket")
  const lane = "overflow-x-auto border border-solid border-line px-4 pb-4 pt-3"
  const head = "mb-3 flex items-center gap-2 font-mono text-[10px]/none font-bold uppercase tracking-[0.14em]"
  return (
    <div className="grid gap-4">
      <div className={cn(lane, "bg-base-2")}>
        <div className={cn(head, "text-ok")}>
          <Icon name="trophy" size={13} />
          {t("winnersTitle")}
        </div>
        <DkBracket rounds={d.winners} renderMatch={(m) => <TnBracketMatch m={m} onOpen={onOpen} champion={d.champion} hi={hi} />} />
      </div>
      <div className={cn(lane, "bg-[color-mix(in_srgb,var(--bad)_3%,var(--bg-2))]")}>
        <div className={cn(head, "text-bad")}>
          <Icon name="refresh" size={13} />
          {t("losersTitle")}
        </div>
        <DkBracket rounds={d.losers} renderMatch={(m) => <TnBracketMatch m={m} onOpen={onOpen} champion={d.champion} hi={hi} />} />
      </div>
      {d.grandFinal && (
        <div className={cn(lane, "bg-[color-mix(in_srgb,var(--accent)_4%,var(--bg-2))]")}>
          <div className={cn(head, "text-accent-bright")}>
            <Icon name="star" size={13} />
            {t("grandFinalTitle")}
          </div>
          <div className="max-w-[320px]">
            <TnBracketMatch m={d.grandFinal} onOpen={onOpen} champion={d.champion} hi={hi} reset={d.grandFinal.reset} />
          </div>
          {d.grandFinal.reset && <p className="mt-2 font-mono text-[10.5px]/[1.4] font-medium text-txt-dim">{t("resetNote")}</p>}
        </div>
      )}
    </div>
  )
}
