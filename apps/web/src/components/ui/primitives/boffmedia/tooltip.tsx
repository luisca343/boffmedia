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
    <span className="k-tipwrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      <span className={cn("k-tip", open && "k-tip--on")} style={{ left: "50%", transform: "translateX(-50%)", ...pos }} role="tooltip">
        {label}<span className="k-tip__arr" data-side={side} />
      </span>
    </span>
  )
}
