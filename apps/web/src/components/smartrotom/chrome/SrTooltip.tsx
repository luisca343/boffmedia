"use client"

import { useId, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface SrTooltipProps {
  content: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The sr-* chrome's own tooltip: hover/focus reveal, positioned relative to the
 * trigger. No Radix, no portal — the chrome never needs to escape its own stacking
 * context, so the plain CSS/positioning version is all `Tooltip` ever was here.
 */
export function SrTooltip({ content, children, className }: SrTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-sr-line bg-sr-panel px-3 py-1.5 text-sm text-sr-txt shadow-md",
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
