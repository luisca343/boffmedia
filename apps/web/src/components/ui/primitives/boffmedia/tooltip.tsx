"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffTooltipProps {
  label: string
  side?: "top" | "bottom"
  children: React.ReactNode
}

export function BoffTooltip({ label, side = "top", children }: BoffTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const pos = side === "bottom" ? { top: "calc(100% + 9px)" } : { bottom: "calc(100% + 9px)" }
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span
        className={cn(
          "absolute z-[120] whitespace-nowrap pointer-events-none",
          "text-xs font-semibold py-1.5 px-2.5",
          "rounded-[var(--radius,14px)]",
          "bg-[var(--text)] text-[var(--bg)]",
          "opacity-0 -translate-x-1/2 translate-y-1",
          "transition-[opacity,transform] duration-[0.16s] ease-[var(--ease)]",
          open && "opacity-100 translate-y-0",
        )}
        style={{ left: "50%", transform: "translateX(-50%)", ...pos }}
        role="tooltip"
      >
        {label}
        <span
          className={cn(
            "absolute left-1/2 w-2 h-2 bg-[var(--text)] -translate-x-1/2 rotate-45",
            side === "top" ? "-bottom-[3px]" : "-top-[3px]",
          )}
        />
      </span>
    </span>
  )
}
