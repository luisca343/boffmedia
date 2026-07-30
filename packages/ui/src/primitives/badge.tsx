import * as React from "react"
import { cn } from "../cn"

export type BadgeTone = "default" | "live" | "new" | "ok" | "warn" | "bad" | "info"

const TONES: Record<BadgeTone, string> = {
  default: "bg-panel-2 border-line-2 text-txt-muted",
  live: "bg-accent border-accent text-accent-ink animate-[bm-pulse_2s_ease-in-out_infinite] motion-reduce:animate-none",
  new: "bg-accent-soft border-accent-line text-accent",
  ok: "bg-ok-soft border-transparent text-ok",
  warn: "bg-warn-soft border-transparent text-warn",
  bad: "bg-bad-soft border-transparent text-bad",
  info: "bg-signal-soft border-transparent text-signal",
}

export interface BadgeProps {
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
}

export function Badge({ tone = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block font-mono font-bold text-[10px] leading-none uppercase tracking-[0.12em] py-[5px] px-[9px] border border-solid",
        "cut [--cut:4px]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
