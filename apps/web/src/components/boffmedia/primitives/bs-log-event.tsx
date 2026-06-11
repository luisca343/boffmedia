"use client"

import { cn } from "@/lib/utils"
import { tyVar } from "./bs-data"
import { BSType } from "./bs-type"

interface LogEv {
  turn?: number
  kind?: string
  who?: string
  actor?: string
  txt?: string
  icon?: string
  type?: string
  dmg?: string
  heal?: string
  boost?: string
  eff?: string
  crit?: boolean
}

interface BSLogEventProps {
  ev: LogEv
}

export function BSLogEvent({ ev }: BSLogEventProps) {
  if (ev.turn != null) {
    return (
      <div className="flex items-center gap-[.7rem] my-[.4rem] mx-0">
        <span className="font-mono font-bold text-[.62rem] tracking-[.14em] uppercase text-[var(--accent-bright)] whitespace-nowrap">
          Turno {ev.turn}
        </span>
        <span className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg, var(--accent-soft), transparent)" }} />
      </div>
    )
  }
  if (ev.kind === "sys") {
    return (
      <div className="flex gap-[.6rem] px-[.65rem] py-[.2rem] items-start">
        <div className="flex-1 min-w-0 text-[color:var(--text-muted)] text-t-xs italic">{ev.txt}</div>
      </div>
    )
  }
  const c = ev.type ? tyVar(ev.type) : ev.kind === "boost" ? "var(--emerald-400)" : "var(--accent)"
  return (
    <div
      className={cn("flex gap-[.6rem] px-[.65rem] py-[.55rem] rounded-[var(--radius)] items-start", "bg-[var(--surface-2)] border border-solid border-[var(--border)]", ev.crit && "ev--crit")}
    >
      <span
        className="shrink-0 w-[26px] h-[26px] rounded-[7px] grid place-items-center"
        style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}
      >
        <LogIcon name={ev.icon || "bolt"} />
      </span>
      <div className="flex-1 min-w-0 text-t-sm leading-[1.4]">
        <span dangerouslySetInnerHTML={{ __html: ev.txt || "" }} />
        {(ev.dmg || ev.boost || ev.eff || ev.heal) && (
          <div className="flex gap-[.35rem] flex-wrap mt-[.3rem]">
            {ev.type && <BSType type={ev.type} />}
            {ev.dmg && (
              <span className="font-mono font-bold text-[.6rem] px-[.45em] py-[.2em] rounded-[4px] text-[var(--rose-400)] bg-[color-mix(in_srgb,var(--rose-500)_14%,transparent)] border border-solid border-[color-mix(in_srgb,var(--rose-500)_32%,transparent)]">
                {ev.dmg}
              </span>
            )}
            {ev.heal && (
              <span className="font-mono font-bold text-[.6rem] px-[.45em] py-[.2em] rounded-[4px] text-[var(--emerald-400)] bg-[color-mix(in_srgb,var(--emerald-500)_14%,transparent)] border border-solid border-[color-mix(in_srgb,var(--emerald-500)_32%,transparent)]">
                {ev.heal}
              </span>
            )}
            {ev.boost && (
              <span className="font-mono font-bold text-[.58rem] tracking-[.04em] px-[.42em] py-[.2em] rounded-[4px] leading-none inline-flex gap-[.2em] border text-[var(--emerald-400)] bg-[color-mix(in_srgb,var(--emerald-500)_16%,transparent)] border-[color-mix(in_srgb,var(--emerald-500)_40%,transparent)]">
                {ev.boost}
              </span>
            )}
            {ev.eff === "super" && (
              <span className="font-mono font-bold text-[.6rem] tracking-[.06em] px-[.45em] py-[.18em] rounded-[4px] text-[var(--emerald-400)] bg-[color-mix(in_srgb,var(--emerald-500)_16%,transparent)]">
                Súper eficaz
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatRowData {
  who: string
  side: string
  msg: string
}

interface BSChatRowProps {
  row: ChatRowData
}

export function BSChatRow({ row }: BSChatRowProps) {
  return (
    <div className="flex gap-[.55rem] py-[.35rem] items-baseline text-t-sm">
      <span
        className={cn(
          "font-bold shrink-0",
          row.side === "cast" && "text-[var(--purple-400)]",
          row.side === "p1" && "text-[var(--accent-bright)]",
          row.side === "p2" && "text-[var(--orange-400)]",
        )}
      >
        {row.who}
      </span>
      <span className="text-[var(--text-muted)] min-w-0">{row.msg}</span>
    </div>
  )
}

function LogIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    bolt: '<path d="M8 1L3 8h3.5l-.5 6L12 7H8.5l.5-6z"/>',
    shield: '<path d="M7.5 1L2 3v4a6 6 0 005 5 6 6 0 005-5V3l-4.5-2z"/>',
    trending: '<path d="M1 10l4-4 3 3 5-6M9 3h4v4" stroke-linecap="round" stroke-linejoin="round"/>',
    arrow: '<path d="M7 1v12M2 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>',
  }
  const p = paths[name]
  if (!p) return null
  return (
    <svg width={15} height={15} viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <g dangerouslySetInnerHTML={{ __html: p }} />
    </svg>
  )
}
