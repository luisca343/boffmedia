"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioOption { value: string; label: string; desc?: string; disabled?: boolean }

interface RadioGroupProps {
  value?: string
  defaultValue?: string
  options: (RadioOption | string)[]
  onChange?: (value: string) => void
  name?: string
  className?: string
}

export function RadioGroup({ value, defaultValue, options, onChange, name, className }: RadioGroupProps) {
  const [v, setV] = React.useState(defaultValue)
  const cur = value !== undefined ? value : v
  const pick = (val: string) => { if (value === undefined) setV(val); onChange && onChange(val) }
  const items = options.map((o) => typeof o === "string" ? { value: o, label: o } : o)

  return (
    <div className={cn("flex flex-col gap-2.5", className)} role="radiogroup">
      {items.map((o) => {
        const on = cur === o.value
        return (
          <label
            key={o.value}
            className={cn(
              "flex gap-3 items-start py-3.5 px-4",
              "rounded-[var(--radius,14px)]",
              "border border-solid border-[var(--border)]",
              "bg-[var(--surface-2)]",
              "cursor-pointer",
              "transition-[border-color,background] duration-[var(--dur,0.32s)]",
              "hover:border-[var(--border-strong)]",
              on && "border-[var(--accent)] bg-[var(--accent-soft)]",
              o.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <input type="radio" name={name} checked={on} disabled={o.disabled} onChange={() => pick(o.value)} className="absolute opacity-0 pointer-events-none" />
            <span className={cn(
              "shrink-0 w-[18px] h-[18px] rounded-full border-2 border-solid border-[var(--border-strong)] mt-px",
              "grid place-items-center",
              "transition-[border-color] duration-[var(--dur,0.32s)]",
              on && "border-[var(--accent)]",
              on && "after:content-[''] after:w-[9px] after:h-[9px] after:rounded-full after:bg-[var(--accent)]",
            )} />
            <span className="flex flex-col gap-[3px]">
              <span className="text-sm font-semibold">{o.label}</span>
              {o.desc && <span className="text-xs text-[var(--text-muted)]">{o.desc}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
