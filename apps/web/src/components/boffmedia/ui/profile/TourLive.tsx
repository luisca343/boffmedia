import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import type { TourData } from "./profile-data"

export interface TourLiveProps extends TourData {
  liveLabel?: string
  className?: string
}

export function TourLive({ name, where, format, stats, roundLabel, vs, liveLabel = "En vivo", className }: TourLiveProps) {
  return (
    <div
      className={cn(
        "mb-[22px] border border-solid border-line border-l-[3px] border-l-[hsl(28_60%_50%)] bg-panel cut-corner",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-solid border-line bg-panel-2 px-[18px] py-[11px]">
        <span className="inline-flex items-center gap-2 font-mono text-[10px]/none font-bold uppercase tracking-[0.12em] text-bad">
          <i className="h-[7px] w-[7px] rounded-full bg-bad animate-[bm-pulse_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
          {liveLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px]/none font-semibold text-[hsl(28_65%_62%)]">
          <Icon name="gamepad" size={13} className="text-[hsl(28_65%_62%)]" />
          {format}
        </span>
      </div>

      <div className="grid items-center gap-5 p-[16px_18px] [grid-template-columns:1fr_auto] max-[720px]:grid-cols-1">
        <div>
          <h3 className="mb-1 font-display text-[20px]/[1.05] font-bold uppercase tracking-[0.02em] text-txt">{name}</h3>
          <p className="mb-3 font-mono text-[12px]/[1.3] text-txt-muted">{where}</p>
          <div className="flex flex-wrap gap-0 [row-gap:14px]">
            {stats.map((s) => (
              <div key={s.k} className="grid gap-1.5 border-l border-solid border-line px-[22px] py-0.5 first:border-l-0 first:pl-0">
                <span className="font-mono text-[9px]/none font-bold uppercase tracking-[0.15em] text-txt-dim">{s.k}</span>
                <span className="font-display text-[26px]/none font-bold italic text-txt [&_em]:font-bold [&_em]:not-italic [&_em]:text-txt-dim">
                  {s.v}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-w-[220px] justify-items-start gap-[9px] border-l border-solid border-line pl-5 max-[720px]:border-l-0 max-[720px]:border-t max-[720px]:pl-0 max-[720px]:pt-4">
          <span className="inline-flex items-center gap-[7px] font-mono text-[9.5px]/none font-bold uppercase tracking-[0.12em] text-ok">
            <i className="h-1.5 w-1.5 rounded-full bg-ok" />
            {roundLabel}
          </span>
          <p className="font-body text-[14px]/[1.4] text-txt-muted [&_b]:inline-flex [&_b]:items-center [&_b]:gap-[5px] [&_b]:font-bold [&_b]:text-txt">
            {vs}
          </p>
        </div>
      </div>
    </div>
  )
}
