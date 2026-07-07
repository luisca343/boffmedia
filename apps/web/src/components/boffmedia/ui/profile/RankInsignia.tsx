import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import type { RankData } from "./profile-data"

export type RankInsigniaProps = RankData & { className?: string }

export function RankInsignia({ icon, tier, sub, pct, metaLeft, metaRight, className }: RankInsigniaProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-solid border-line border-l-4 border-l-accent p-[22px_24px]",
        "bg-[linear-gradient(150deg,var(--accent-soft),var(--panel)_62%)]",
        "[clip-path:polygon(0_0,calc(100%_-_14px)_0,100%_14px,100%_100%,0_100%)]",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <span className="grid h-[58px] w-[58px] flex-none place-items-center bg-accent text-accent-ink [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]">
          <Icon name={icon} size={26} />
        </span>
        <div>
          <div className="font-display text-[26px]/none font-extrabold italic uppercase text-txt">{tier}</div>
          <div className="mt-1.5 font-mono text-[10px]/none font-medium uppercase tracking-[0.12em] text-txt-muted">
            {sub}
          </div>
        </div>
      </div>
      <div className="mt-5 h-1.5 w-full overflow-hidden bg-line">
        <div className="h-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-[11px] flex justify-between font-mono text-[11px]/none font-medium uppercase tracking-[0.06em] text-txt-muted [&_b]:font-semibold [&_b]:text-txt">
        <span>{metaLeft}</span>
        <span>{metaRight}</span>
      </div>
    </div>
  )
}
