import * as React from "react"
import { cn } from "@/lib/utils"

const CLIP = "polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)"

export interface ChipProps {
  children: React.ReactNode
  on?: boolean
  className?: string
}

export function Chip({ children, on, className }: ChipProps) {
  return (
    <span
      style={{ clipPath: CLIP }}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap border border-solid px-3 py-[7px] font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.1em] transition-[color,border-color,background] duration-[140ms]",
        on ? "border-accent-line bg-accent-soft text-accent" : "border-line-2 text-txt-muted",
        className,
      )}
    >
      {children}
    </span>
  )
}
