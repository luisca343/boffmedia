"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface SegmentedOption { value: string; label: string; icon?: string }

interface SegmentedProps {
  value: string
  options: (SegmentedOption | string)[]
  onChange: (value: string) => void
  className?: string
}

export function Segmented({ value, options, onChange, className }: SegmentedProps) {
  const items = options.map((o) => typeof o === "string" ? { value: o, label: o } : o)
  return (
    <div
      className={cn(
        "inline-flex p-[3px] gap-[2px]",
        "bg-layer-2",
        "border border-solid border-edge",
        "rounded-[var(--radius-pill,9999px)]",
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
              "inline-flex items-center gap-1.5",
              "font-body text-sm font-semibold",
              "text-ink-muted",
              "py-[7px] px-3.5",
              "border-0 bg-transparent",
              "rounded-[calc(var(--radius-pill,9999px)-3px)]",
              "cursor-pointer",
              "transition-[color,background] duration-[var(--dur,0.32s)]",
              active && "text-[var(--on-secondary)] bg-secondary-hover",
            )}
            onClick={() => onChange(o.value)}
          >
            {o.icon && <Icon name={o.icon} size={16} />}{o.label}
          </button>
        )
      })}
    </div>
  )
}
