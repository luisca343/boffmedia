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
    <div className={cn("tabs", className)} role="tablist">
      {items.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={cn("tabs__tab", value === o.value && "tabs__tab--active")} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}{o.label}
          {o.count != null && <span className="tabs__count">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}
