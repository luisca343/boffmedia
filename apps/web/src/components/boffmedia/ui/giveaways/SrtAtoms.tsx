"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { srtSourceMeta, srtPrizeMeta, type SrtPrizeType, type SrtSourceKey, type SrtStatus, type SrtOrganizerData } from "./giveaways-util"

// The giveaway atoms: status chip (4 lifecycle states), organizer seal, source
// tag, prize-type pill and the weighted ticket meter. Prefix srt- in sorteos.css.

const STATUS_CLS: Record<string, string> = {
  active: "border-accent bg-accent text-accent-ink",
  upcoming: "border-transparent bg-[color:var(--info-soft)] text-[color:var(--info)]",
  ended: "border-transparent bg-warn-soft text-warn",
  announced: "border-accent-line bg-[color-mix(in_srgb,var(--accent)_20%,var(--panel))] text-accent",
}

export function SrtStatusChip({ status, size }: { status: SrtStatus; size?: "lg" }) {
  const key = status.key || "upcoming"
  const dot = key === "active" || key === "ended"
  return (
    <span
      className={cn(
        "cut [--cut:4px] inline-flex items-center gap-[7px] border border-solid px-2.5 py-1.5 font-mono text-[10px]/none font-bold uppercase tracking-[0.12em]",
        STATUS_CLS[key] || "border-line-2 bg-panel-2 text-txt-muted",
        size === "lg" && "px-[13px] py-2 text-[11px]",
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            "flex-none rounded-full",
            key === "active" ? "h-[7px] w-[7px] bg-accent-ink animate-[bm-blink_1.3s_steps(2)_infinite] motion-reduce:animate-none" : "h-1.5 w-1.5 bg-warn animate-[bm-pulse_1s_ease-in-out_infinite] motion-reduce:animate-none",
          )}
        />
      )}
      {status.label}
    </span>
  )
}

const ORG_SEAL: Record<string, string> = {
  boffmedia: "bg-accent text-accent-ink",
  streamer: "bg-[#9146ff] text-white",
  comunidad: "border border-solid border-line-2 bg-panel-2 text-txt",
}

export function SrtOrganizer({ organizer }: { organizer: SrtOrganizerData }) {
  const o = organizer || ({} as SrtOrganizerData)
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px]/none font-semibold tracking-[0.05em] text-txt-muted">
      <span className={cn("grid h-6 w-6 flex-none place-items-center font-display text-[11px]/none font-bold cut-seal [--cut:5px]", ORG_SEAL[o.kind] || ORG_SEAL.boffmedia)}>{o.avatar || "B"}</span>
      Por <b className="font-bold text-txt">{o.name}</b>
    </span>
  )
}

export function SrtSourceTag({ source }: { source: SrtSourceKey }) {
  const m = srtSourceMeta(source)
  return (
    <span className="inline-flex items-center gap-[7px] border border-dashed border-line-2 px-[9px] py-[5px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.09em] text-txt-muted">
      <Icon name={m.icon} size={12} className={source === "twitch" ? "text-[#9146ff]" : "text-[color:var(--info)]"} />
      {m.label}
    </span>
  )
}

export function SrtPrizeTag({ type, winners }: { type: SrtPrizeType; winners?: number }) {
  const m = srtPrizeMeta(type)
  return (
    <span className="cut [--cut:4px] inline-flex items-center gap-1.5 border border-solid border-accent-line bg-accent-soft px-2 py-[5px] font-mono text-[9.5px]/none font-semibold uppercase tracking-[0.1em] text-accent">
      <Icon name={m.icon} size={12} />
      {m.label}
      {winners && winners > 1 ? ` · ${winners} ganadores` : ""}
    </span>
  )
}

export function SrtTicketMeter({ tickets, max, odds, label = "Tus tickets" }: { tickets: number; max: number; odds?: number | null; label?: string }) {
  const pct = max ? Math.min(100, (tickets / max) * 100) : 0
  return (
    <div className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px]/none font-medium uppercase tracking-[0.1em] text-txt-muted">{label}</span>
        <span className="font-display text-[22px]/none font-extrabold italic text-accent">
          {tickets}
          <small className="ml-1 font-mono text-[10px]/none font-medium not-italic tracking-[0.06em] text-txt-muted">/ {max}</small>
        </span>
      </div>
      <div className="h-2 overflow-hidden border border-solid border-line bg-panel-2">
        <span className="block h-full [background:repeating-linear-gradient(-55deg,var(--accent)_0_8px,var(--accent-bright)_8px_16px)] transition-[width] duration-[420ms]" style={{ width: pct + "%" }} />
      </div>
      {odds != null && (
        <div className="mt-[7px] font-mono text-[10px]/[1.4] font-medium tracking-[0.04em] text-txt-dim">
          Probabilidad estimada <b className="text-txt">{odds < 0.1 ? "<0,1" : odds.toFixed(1)}%</b> · ponderada por tickets
        </div>
      )}
    </div>
  )
}
