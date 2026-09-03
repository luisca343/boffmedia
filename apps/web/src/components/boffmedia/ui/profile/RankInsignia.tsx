import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import type { RankData } from "./profile-data"

export type RankInsigniaProps = RankData & { className?: string }

export function RankInsignia({ icon, tier, sub, pct, metaLeft, metaRight, className }: RankInsigniaProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-solid border-line border-l-4 border-l-accent p-[22px_24px]",
        "bg-[linear-gradient(150deg,var(--accent-soft),var(--panel)_62%)]",
        "cut-corner cut-corner-edge [--cut-lg:14px] [--cut-line:var(--line)]",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <span className="grid h-[3.625rem] w-[3.625rem] flex-none place-items-center bg-accent text-accent-ink [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]">
          <Icon name={icon} size={26} />
        </span>
        <div>
          <div className="font-display text-[1.625rem]/none font-extrabold italic uppercase text-txt">{tier}</div>
          <div className="mt-1.5 font-mono text-[0.625rem]/none font-medium uppercase tracking-[0.12em] text-txt-muted">
            {sub}
          </div>
        </div>
      </div>
      <div className="mt-5 h-1.5 w-full overflow-hidden bg-line">
        <div className="h-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-[0.6875rem] flex justify-between font-mono text-[0.6875rem]/none font-medium uppercase tracking-[0.06em] text-txt-muted [&_b]:font-semibold [&_b]:text-txt">
        <span>{metaLeft}</span>
        <span>{metaRight}</span>
      </div>
    </div>
  )
}
