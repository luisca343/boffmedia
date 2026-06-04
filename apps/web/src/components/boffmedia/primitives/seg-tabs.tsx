"use client"

import { cn } from "@/lib/utils"

interface SegTabOption {
  value: string
  label: string
  count?: number
}

interface SegTabsProps {
  value: string
  options: (SegTabOption | string)[]
  onChange: (value: string) => void
  size?: "sm" | "md"
  className?: string
}

export function SegTabs({ value, options, onChange, size = "md", className }: SegTabsProps) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  const sizeCls = size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3 py-1.5"
  return (
    <div className={cn("flex gap-px rounded-[var(--radius)] overflow-hidden border border-[var(--border)]", className)} role="tablist">
      {items.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            className={cn(
              sizeCls,
              "font-medium transition-colors",
              active
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-2)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]",
            )}
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.count != null && <span className="ml-1 font-mono text-xs opacity-70">{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
