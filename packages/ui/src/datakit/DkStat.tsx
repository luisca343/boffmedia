import * as React from "react"
import { cn } from "../cn"
import type { DkTone } from "./utils"

const TONE_TOP: Record<DkTone, string> = {
  pos: "border-t-ok [&>b]:text-ok",
  neg: "border-t-bad [&>b]:text-bad",
  accent: "border-t-accent [&>b]:text-accent-bright",
  neutral: "border-t-line-2",
}

export function DkStat({
  value,
  label,
  tone = "neutral",
  small,
  className,
}: {
  value: React.ReactNode
  label: React.ReactNode
  tone?: DkTone
  small?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-[5px] border border-solid border-line border-t-[3px] bg-panel",
        small ? "px-3 py-[10px]" : "px-[15px] py-[13px]",
        TONE_TOP[tone],
        className,
      )}
    >
      <b className={cn("font-display font-extrabold italic leading-none tracking-[0.01em]", small ? "text-[19px]" : "text-[26px]")}>
        {value}
      </b>
      <span className="font-mono text-[9px] font-semibold uppercase leading-[1.3] tracking-[0.12em] text-txt-dim">{label}</span>
    </div>
  )
}

/**
 * Win / draw / loss ratio bar with an optional right-aligned rate label.
 */
export function DkSplit({
  win,
  loss,
  draw = 0,
  rate,
  className,
}: {
  win: number
  loss: number
  draw?: number
  rate?: number | null
  className?: string
}) {
  const total = win + loss + draw || 1
  const pct = (n: number) => `${(n / total) * 100}%`
  const rateTone = rate == null ? "text-txt-dim" : rate >= 50 ? "text-ok" : "text-bad"
  return (
    <span className={cn("inline-flex w-full min-w-0 items-center gap-2", className)}>
      <span className="flex h-[7px] min-w-[40px] flex-1 overflow-hidden border border-solid border-line bg-base">
        <i style={{ width: pct(win) }} className="block h-full bg-ok" />
        <i style={{ width: pct(draw) }} className="block h-full bg-warn" />
        <i style={{ width: pct(loss) }} className="block h-full bg-bad opacity-80" />
      </span>
      {rate !== undefined && (
        <span className={cn("w-[38px] flex-none text-right font-mono text-[11px] font-bold leading-none", rateTone)}>
          {rate == null ? "—" : `${rate}%`}
        </span>
      )}
    </span>
  )
}
