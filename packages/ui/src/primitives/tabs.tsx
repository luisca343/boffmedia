import * as React from "react"
import { cn } from "../cn"

export interface TabItem {
  value: string
  label: React.ReactNode
  count?: number
}

export interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn("flex gap-1 border-b border-solid border-line", className)}>
      {tabs.map((t) => {
        const on = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              "font-display text-[14px] font-bold leading-none uppercase tracking-[0.08em]",
              "pt-3 px-[18px] pb-[11px] border-b-[3px] border-solid -mb-px transition-[color,border-color] duration-[140ms]",
              "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]",
              on ? "text-txt border-accent" : "text-txt-muted border-transparent hover:text-txt",
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cn("font-mono text-[10px] font-semibold leading-none ml-[7px]", on ? "text-accent" : "text-txt-dim")}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
