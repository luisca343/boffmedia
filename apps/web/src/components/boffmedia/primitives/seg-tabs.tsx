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
  return (
    <div
      className={cn(
        "inline-flex gap-[0.2rem] p-[3px] shrink-0",
        "rounded-[var(--radius)] [border-width:var(--hairline)] border-solid [border-color:var(--border)]",
        "bg-[color-mix(in_srgb,var(--surface-3)_55%,transparent)]",
        className,
      )}
      role="tablist"
    >
      {items.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex items-center gap-[0.4rem]",
              "border-0 bg-transparent cursor-pointer",
              "text-[var(--text-muted)] font-semibold",
              "whitespace-nowrap",
              "rounded-[calc(var(--radius)-3px)]",
              "transition-colors duration-[var(--dur)] ease-[var(--ease)]",
              size === "sm" ? "text-xs py-[0.34rem] px-[0.7rem]" : "text-sm py-[0.42rem] px-[0.85rem]",
              "hover:text-[var(--text)]",
              active && "bg-[var(--accent-soft)] text-[var(--accent-bright)]",
            )}
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.count != null && (
              <span className="font-mono text-[10px] py-[0.05rem] px-[0.32rem] rounded-[var(--radius-pill)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] text-[var(--text-dim)]">
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
