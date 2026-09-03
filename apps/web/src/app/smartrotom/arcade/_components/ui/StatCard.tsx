import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Panel } from "./Panel"

export type ArStatTone = "cyan" | "magenta" | "amber" | "violet" | "lime"

export interface StatCardProps {
  kicker: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: ArStatTone
}

const TONE: Record<ArStatTone, string> = {
  cyan: "text-ar-cyan",
  magenta: "text-ar-magenta-2",
  amber: "text-ar-amber",
  violet: "text-ar-violet-2",
  lime: "text-ar-lime",
}

/** A single readout on the streak/collection stat rows. */
export function StatCard({ kicker, value, sub, icon, tone = "cyan" }: StatCardProps) {
  return (
    <Panel tone="deep" tight>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div
          className={cn(
            "font-ar-display text-[0.5rem] uppercase leading-relaxed tracking-[0.12em]",
            TONE[tone],
          )}
        >
          {kicker}
        </div>
        {icon && <span className={TONE[tone]}>{icon}</span>}
      </div>
      <div className="font-ar-display text-[1.5rem] leading-none text-ar-ink">{value}</div>
      {sub && <div className="mt-1.5 font-ar-mono text-[0.6875rem] text-ar-ink-muted">{sub}</div>}
    </Panel>
  )
}
