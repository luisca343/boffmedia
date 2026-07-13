// PAPER.

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** A Marcellus section heading with the count set to the right of it, over a hairline. */
export function SectionLabel({
  children,
  count,
  className,
}: {
  children: ReactNode
  count?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-2.5 flex items-baseline justify-between gap-2.5 border-b border-ps-ink/22 pb-1.5",
        "font-ps-ceremony text-[16px] text-ps-ink",
        className,
      )}
    >
      <span>{children}</span>
      {count != null && <span className="ps-num font-ps-mono text-[11px] text-ps-ink-faint">{count}</span>}
    </div>
  )
}
