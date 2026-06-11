"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BoffActionBarProps {
  start?: ReactNode
  center?: ReactNode
  end?: ReactNode
  className?: string
  "aria-label"?: string
}

/**
 * Horizontal toolbar with start/center/end slots. Wraps on narrow widths.
 */
export function BoffActionBar({ start, center, end, className, "aria-label": ariaLabel }: BoffActionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-3 flex-wrap rounded-[var(--radius)] border border-[var(--border)] p-[var(--bsx-pad-md)]",
        className,
      )}
      style={{ background: "var(--card-bg)" }}
    >
      {start && <div className="flex items-center gap-2 min-w-0 flex-wrap">{start}</div>}
      {center && <div className="flex items-center gap-2 min-w-0 mx-auto flex-wrap">{center}</div>}
      {end && <div className="flex items-center gap-2 min-w-0 ml-auto flex-wrap">{end}</div>}
    </div>
  )
}
