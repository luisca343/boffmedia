import * as React from "react"
import { cn } from "@/lib/utils"
import type { EventStatus } from "./events-util"

export interface EventStatusChipProps {
  status: EventStatus
  label: string
  lg?: boolean
  className?: string
}

// --cut-line repeats each tone's border colour: `.cut-edge-slant` paints the two
// slants the clip removes, and it cannot read a `border-*` utility.
const TONE: Record<EventStatus, string> = {
  active: "border-accent [--cut-line:var(--accent)] bg-accent text-accent-ink",
  upcoming: "border-transparent [--cut-line:transparent] bg-signal-soft text-signal",
  completed: "border-line [--cut-line:var(--line)] bg-panel-2 text-txt-dim",
}

export function EventStatusChip({ status, label, lg, className }: EventStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.4375rem] border border-solid font-mono font-bold uppercase tracking-[0.12em]",
        "cut cut-edge-slant [--cut:4px]",
        lg ? "px-[0.8125rem] py-2 text-[0.6875rem]/none" : "px-2.5 py-1.5 text-[0.625rem]/none",
        TONE[status],
        className,
      )}
    >
      {status === "active" && (
        <i className="h-[0.4375rem] w-[0.4375rem] rounded-full bg-accent-ink animate-[bm-pulse_1.3s_steps(2)_infinite] motion-reduce:animate-none" />
      )}
      {label}
    </span>
  )
}
