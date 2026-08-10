import * as React from "react"
import { cn } from "../cn"

export type BadgeTone = "default" | "live" | "new" | "ok" | "warn" | "bad" | "info"

// `.cut-frame` colours: --cut-line is the stroke, --cut-fill the interior. `new`
// spells its fill as a color-mix rather than --accent-soft because a translucent
// fill would composite over the stroke slab instead of over the page behind it;
// the tones whose stroke is transparent keep their soft token safely.
const TONES: Record<BadgeTone, string> = {
  default: "[--cut-line:var(--line-2)] [--cut-fill:var(--panel-2)] text-txt-muted",
  live: "[--cut-line:var(--accent)] [--cut-fill:var(--accent)] text-accent-ink animate-[bm-pulse_2s_ease-in-out_infinite] motion-reduce:animate-none",
  new: "[--cut-line:var(--accent-line)] [--cut-fill:color-mix(in_srgb,var(--accent)_13%,var(--panel))] text-accent",
  ok: "[--cut-line:transparent] [--cut-fill:var(--ok-soft)] text-ok",
  warn: "[--cut-line:transparent] [--cut-fill:var(--warn-soft)] text-warn",
  bad: "[--cut-line:transparent] [--cut-fill:var(--bad-soft)] text-bad",
  info: "[--cut-line:transparent] [--cut-fill:var(--info-soft)] text-signal",
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
        "inline-block font-mono font-bold text-[10px] leading-none uppercase tracking-[0.12em] py-[6px] px-[10px]",
        "cut-frame [--cut:4px] [--cut-w:1px]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
