import * as React from "react"
import { cn } from "@/lib/utils"

export interface DividerProps {
  label?: React.ReactNode
  className?: string
}

export function Divider({ label, className }: DividerProps) {
  if (!label) return <div className={cn("h-px w-full bg-line", className)} role="separator" />
  return (
    <div
      role="separator"
      aria-label={typeof label === "string" ? label : undefined}
      className={cn(
        "flex items-center gap-[14px] text-txt-dim",
        "before:content-[''] before:h-px before:flex-1 before:bg-line",
        "after:content-[''] after:h-px after:flex-1 after:bg-line",
        className,
      )}
    >
      <span className="font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.1em]">{label}</span>
    </div>
  )
}
