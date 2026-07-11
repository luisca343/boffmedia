import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps {
  children: React.ReactNode
  lg?: boolean
  accent?: boolean
  className?: string
}

export function Avatar({ children, lg, accent, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center border border-solid font-display font-bold uppercase leading-none shrink-0",
        "cut-seal [--cut:8px]",
        lg ? "h-16 w-16 text-[22px]" : "h-9 w-9 text-[13px]",
        accent ? "bg-accent border-accent text-accent-ink" : "bg-panel-2 border-line-2",
        className,
      )}
    >
      {children}
    </span>
  )
}

export interface AvatarGroupProps {
  items: (string | { label: string; accent?: boolean })[]
  max?: number
  lg?: boolean
}

export function AvatarGroup({ items, max = 5, lg }: AvatarGroupProps) {
  const shown = items.slice(0, max)
  const extra = items.length - shown.length
  return (
    <span className="inline-flex [&>*]:-ml-[9px] [&>*:first-child]:ml-0">
      {shown.map((it, i) => {
        const o = typeof it === "string" ? { label: it } : it
        return (
          <Avatar key={i} lg={lg} accent={o.accent}>
            {o.label}
          </Avatar>
        )
      })}
      {extra > 0 && (
        <Avatar lg={lg} className="bg-panel font-mono font-semibold text-[11px] text-txt-muted">
          +{extra}
        </Avatar>
      )}
    </span>
  )
}
