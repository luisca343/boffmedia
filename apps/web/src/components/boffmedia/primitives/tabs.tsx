"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface TabOption { value: string; label: string; icon?: string; count?: number }

interface BoffTabsProps {
  value: string
  options: (TabOption | string)[]
  onChange: (value: string) => void
  className?: string
}

export function BoffTabs({ value, options, onChange, className }: BoffTabsProps) {
  const items = options.map((o) => typeof o === "string" ? { value: o, label: o } : o)
  return (
    <div className={cn("inline-flex gap-1 border-b-[var(--hairline,1px)] border-solid border-b-[var(--border)]", className)} role="tablist">
      {items.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            className={cn(
              "relative inline-flex items-center gap-2",
              "font-body text-sm font-semibold",
              "text-[var(--text-muted)]",
              "py-3 px-3.5",
              "border-0 bg-transparent",
              "cursor-pointer",
              "transition-colors duration-[var(--dur,0.32s)]",
              "hover:text-[var(--text)]",
              "after:content-[''] after:absolute after:left-1.5 after:right-1.5 after:-bottom-px after:h-0.5 after:bg-orange-500",
              "after:scale-x-0 after:transition-transform after:duration-[var(--dur,0.32s)] after:ease-[var(--ease)]",
              active && "text-orange-500 after:scale-x-100",
            )}
            onClick={() => onChange(o.value)}
          >
            {o.icon && <Icon name={o.icon} size={16} />}{o.label}
            {o.count != null && (
              <span className={cn(
                "font-mono text-[0.65rem] py-0.5 px-1.5",
                "rounded-[var(--radius-pill,9999px)]",
                "bg-[var(--surface-3)] text-[var(--text-dim)]",
                active && "bg-[color-mix(in_srgb,var(--orange-500)_16%,transparent)] text-orange-500",
              )}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
