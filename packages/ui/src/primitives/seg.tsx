import * as React from "react"
import { cn } from "../cn"

export interface SegOption {
  value: string
  label: React.ReactNode
}

export interface SegProps {
  options: SegOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Seg({ options, value, onChange, className }: SegProps) {
  return (
    <div className={cn("inline-flex border border-solid border-line-2 bg-panel", className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.08em] py-[9px] px-[14px]",
              "border-r border-solid border-line last:border-r-0 transition-[background,color] duration-[140ms]",
              on ? "bg-accent text-accent-ink" : "text-txt-muted",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
