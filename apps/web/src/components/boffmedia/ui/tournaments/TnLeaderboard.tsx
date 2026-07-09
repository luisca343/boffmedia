"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { DkFlag, DkPin } from "@/components/boffmedia/ui/tools/datakit"
import { TnAvatar } from "./TnEntrant"
import type { TnCompetitor } from "./tournaments-util"

export interface TnLbEntry {
  rank: number
  author: TnCompetitor
  score: number
  meta: string
  unit: string
  tag?: string
  verified?: boolean
}
export interface TnLb {
  metric: "score" | "time"
  unit?: string
  entries: TnLbEntry[]
}

// Free-for-all leaderboard (builds, timed runs, speedruns). `.tn-lb`
export function TnLeaderboard({ lb, onOpen, pinned, onPin, query }: { lb: TnLb; onOpen?: (id: string) => void; pinned?: string | null; onPin?: (id: string) => void; query?: string }) {
  const peak = Math.max(...lb.entries.map((e) => e.score), 1)
  const low = Math.min(...lb.entries.map((e) => e.score))
  const q = (query || "").trim().toLowerCase()
  const rows = q ? lb.entries.filter((e) => e.author.name.toLowerCase().includes(q) || (e.tag || "").toLowerCase().includes(q)) : lb.entries
  return (
    <div className="grid gap-1.5">
      {rows.map((e) => {
        const frac = lb.metric === "time" ? low / e.score : e.score / peak
        const top = e.rank <= 3
        const edge = e.rank === 1 ? "#ffcb45" : e.rank === 2 ? "#c7ccd6" : e.rank === 3 ? "#cd8348" : undefined
        return (
          <div
            key={e.author.id}
            style={edge ? { borderLeftColor: edge } : undefined}
            className={cn(
              "grid grid-cols-[48px_minmax(0,1.4fr)_minmax(80px,2fr)_auto_auto] items-center gap-3 border border-solid border-line border-l-[3px] border-l-line-2 bg-panel px-[14px] py-[9px] max-[720px]:grid-cols-[34px_1fr_auto]",
              e.rank === 1 && "bg-[color-mix(in_srgb,var(--warn)_6%,var(--panel))]",
              pinned === e.author.id && "!bg-[color-mix(in_srgb,var(--warn)_7%,transparent)]",
            )}
          >
            <span className={cn("inline-flex items-center gap-1.5 font-mono text-[15px]/none font-extrabold", top ? "text-warn" : "text-txt-muted")}>
              {top && <Icon name="trophy" size={14} />}
              <b>{e.rank}</b>
            </span>
            <span className="flex min-w-0 items-center gap-2.5">
              <TnAvatar c={e.author} size={30} />
              <button type="button" className="group grid min-w-0 gap-0.5 border-0 bg-transparent p-0 text-left enabled:cursor-pointer" onClick={() => onOpen?.(e.author.id)}>
                <b className="truncate font-body text-[13.5px]/[1.15] font-semibold transition-colors group-hover:text-accent-bright">{e.author.name}</b>
                <i className="inline-flex items-center gap-1 truncate font-mono text-[9.5px]/[1.2] not-italic text-txt-dim">
                  {e.tag ? e.tag + " · " : ""}
                  <DkFlag flag={e.author.flag} code={e.author.country} name={e.author.countryName} size={11} /> {e.author.countryName}
                </i>
              </button>
            </span>
            <span className="h-2 overflow-hidden border border-solid border-line-2 bg-base max-[720px]:hidden" aria-hidden="true">
              <i className="block h-full bg-[linear-gradient(90deg,var(--accent),var(--accent-bright))]" style={{ width: Math.max(6, frac * 100) + "%" }} />
            </span>
            <span className="inline-flex items-baseline gap-[5px] justify-self-end">
              <b className="font-mono text-[15px]/none font-extrabold text-txt">{e.meta}</b>
              <span className="font-mono text-[9.5px]/none text-txt-dim">{e.unit}</span>
              {e.verified ? (
                <span className="inline-grid place-items-center text-ok" title="Verificado"><Icon name="check" size={11} /></span>
              ) : (
                <span className="inline-grid place-items-center text-txt-dim" title="Sin verificar"><Icon name="clock" size={11} /></span>
              )}
            </span>
            {onPin && <DkPin on={pinned === e.author.id} onClick={() => onPin(e.author.id)} size={13} />}
          </div>
        )
      })}
      {rows.length === 0 && <p className="font-mono text-[12px]/[1.5] text-txt-dim">Sin entradas para «{query}».</p>}
    </div>
  )
}
