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
    <div className={cn("segmented", className)} role="tablist">
      {items.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value}
          className={cn("segmented__btn", value === o.value && "segmented__btn--active")}
          onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}{o.label}
        </button>
      ))}
    </div>
  )
}
