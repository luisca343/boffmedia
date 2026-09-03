import * as React from "react"
import { cn } from "../cn"

export interface ThirdProps {
  date?: string
  month?: string
  title: string
  meta?: string
  side?: React.ReactNode
  muted?: boolean
  onClick?: () => void
}

export function Third({ date, month, title, meta, side, muted, onClick }: ThirdProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-center gap-[1.125rem] border border-solid border-line bg-panel px-5 py-3.5 transition-[background,border-color] duration-[140ms] [border-left-width:var(--bar)]",
        // `.cut-slant-r`, not the inline polygon it replaces — same shape, but
        // the utility comes with the stroke that draws the slant the clip cuts.
        "cut-slant-r cut-edge-slant-r [--cut:14px] [--cut-line:var(--line)]",
        muted ? "border-l-line-2" : "border-l-accent",
        onClick && "cursor-pointer hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:border-l-accent hover:bg-panel-2",
      )}
    >
      {date && (
        <div className="min-w-[2.75rem] text-center">
          <div className={cn("font-display text-[1.75rem] font-extrabold italic leading-none", muted ? "text-txt-muted" : "text-accent")}>
            {date}
          </div>
          {month && (
            <small className="mt-1 block font-mono text-[0.5625rem] font-medium uppercase leading-none tracking-[0.12em] text-txt-muted">
              {month}
            </small>
          )}
        </div>
      )}
      <div className="min-w-0">
        <h5 className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[1.1875rem] font-bold uppercase leading-none">
          {title}
        </h5>
        {meta && (
          <p className="mt-[0.3125rem] font-mono text-[0.625rem] font-medium uppercase leading-[1.4] tracking-[0.08em] text-txt-muted">
            {meta}
          </p>
        )}
      </div>
      {side && <div className="ml-auto flex shrink-0 items-center gap-2.5">{side}</div>}
    </div>
  )
}
