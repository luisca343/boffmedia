import * as React from "react"
import { cn } from "@/lib/utils"
import type { EventStatus } from "./events-util"

export interface EventStatusChipProps {
  status: EventStatus
  label: string
  lg?: boolean
  className?: string
}

const TONE: Record<EventStatus, string> = {
  active: "border-accent bg-accent text-accent-ink",
  upcoming: "border-transparent bg-signal-soft text-signal",
  completed: "border-line bg-panel-2 text-txt-dim",
}

export function EventStatusChip({ status, label, lg, className }: EventStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] border border-solid font-mono font-bold uppercase tracking-[0.12em]",
        "cut [--cut:4px]",
        lg ? "px-[13px] py-2 text-[11px]/none" : "px-2.5 py-1.5 text-[10px]/none",
        TONE[status],
        className,
      )}
    >
      {status === "active" && (
        <i className="h-[7px] w-[7px] rounded-full bg-accent-ink animate-[bm-pulse_1.3s_steps(2)_infinite] motion-reduce:animate-none" />
      )}
      {label}
    </span>
  )
}
