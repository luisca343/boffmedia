import * as React from "react"
import { cn } from "@/lib/utils"

const CLIP = "polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)"

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
      style={{ clipPath: CLIP }}
      className={cn(
        "flex min-w-0 items-center gap-[18px] border border-solid border-line bg-panel px-5 py-3.5 transition-[background,border-color] duration-[140ms] [border-left-width:var(--bar)]",
        muted ? "border-l-line-2" : "border-l-accent",
        onClick && "cursor-pointer hover:border-accent-line hover:border-l-accent hover:bg-panel-2",
      )}
    >
      {date && (
        <div className="min-w-[44px] text-center">
          <div className={cn("font-display text-[28px] font-extrabold italic leading-none", muted ? "text-txt-muted" : "text-accent")}>
            {date}
          </div>
          {month && (
            <small className="mt-1 block font-mono text-[9px] font-medium uppercase leading-none tracking-[0.12em] text-txt-muted">
              {month}
            </small>
          )}
        </div>
      )}
      <div className="min-w-0">
        <h5 className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[19px] font-bold uppercase leading-none">
          {title}
        </h5>
        {meta && (
          <p className="mt-[5px] font-mono text-[10px] font-medium uppercase leading-[1.4] tracking-[0.08em] text-txt-muted">
            {meta}
          </p>
        )}
      </div>
      {side && <div className="ml-auto flex shrink-0 items-center gap-2.5">{side}</div>}
    </div>
  )
}
