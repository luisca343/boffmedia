// PAPER. A translucent panel printed onto the stock — never a floating dark card.

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

/**
 * The handoff's `.pcard`: white wash over the paper with an inset top highlight, so it
 * reads as a lighter patch of the same sheet rather than as a card lying on it.
 */
export function Card({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-ps-ink/22 bg-gradient-to-b from-white/50 to-white/[.16] px-[15px] py-[13px]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_2px_6px_rgba(80,60,30,.08)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Icon + label, a big Marcellus figure, a caption. The figure is tabular, always. */
export function Stat({
  icon,
  label,
  value,
  sub,
  className,
}: {
  icon: IconName
  label: string
  value: ReactNode
  sub?: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ps-ink-soft">
        <Icon name={icon} className="h-[17px] w-[17px] text-ps-chapter-deep" />
        <span>{label}</span>
      </div>
      <div className="ps-num mt-1 font-ps-ceremony text-[clamp(20px,2.9vh,30px)] leading-none text-ps-ink">{value}</div>
      {sub && <div className="mt-[3px] text-[11px] text-ps-ink-faint">{sub}</div>}
    </Card>
  )
}
