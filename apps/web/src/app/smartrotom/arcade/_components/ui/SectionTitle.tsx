import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ArAccent = "cyan" | "magenta" | "amber" | "violet"

export interface ArSectionTitleProps {
  kicker?: ReactNode
  title: ReactNode
  accent?: ArAccent
  /** Trailing controls — filters, counts, a "see all" link. */
  right?: ReactNode
  className?: string
}

const ACCENT: Record<ArAccent, string> = {
  cyan: "text-ar-cyan",
  magenta: "text-ar-magenta-2",
  amber: "text-ar-amber",
  violet: "text-ar-violet-2",
}

export function SectionTitle({ kicker, title, accent = "cyan", right, className }: ArSectionTitleProps) {
  return (
    <div className={cn("mb-3.5 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {kicker && (
          <div
            className={cn(
              "mb-2 font-ar-mono text-[11px] font-bold uppercase tracking-[0.18em]",
              ACCENT[accent],
            )}
          >
            {kicker}
          </div>
        )}
        <h2 className="font-ar-display text-[18px] leading-tight text-ar-ink">{title}</h2>
      </div>
      {right}
    </div>
  )
}
