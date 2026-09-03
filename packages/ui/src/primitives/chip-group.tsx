import * as React from "react"
import { cn } from "../cn"

export interface FilterChip {
  value: string
  label: React.ReactNode
  count?: number
  color?: string
}

export interface ChipGroupProps {
  label?: React.ReactNode
  value: string | string[]
  onChange?: (value: string | string[]) => void
  options: FilterChip[]
  multi?: boolean
  className?: string
}

export function ChipGroup({ label, value, onChange, options, multi = false, className }: ChipGroupProps) {
  const vals = multi ? (Array.isArray(value) ? value : []) : value
  const isOn = (v: string) => (multi ? (vals as string[]).indexOf(v) >= 0 : vals === v)
  const toggle = (v: string) => {
    if (!onChange) return
    if (multi) onChange(isOn(v) ? (vals as string[]).filter((x) => x !== v) : (vals as string[]).concat([v]))
    else onChange(v)
  }
  return (
    <div className={cn("flex flex-col gap-[0.3125rem]", className)}>
      {label && (
        <span className="font-mono text-[0.5625rem] font-semibold leading-none uppercase tracking-[0.1em] text-txt-dim">{label}</span>
      )}
      <div role={multi ? "group" : "radiogroup"} aria-label={typeof label === "string" ? label : undefined} className="flex flex-wrap gap-1">
        {options.map((o) => {
          const on = isOn(o.value)
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              style={o.color ? ({ ["--fc" as string]: o.color } as React.CSSProperties) : undefined}
              className={cn(
                "inline-flex items-center gap-[0.3125rem] py-[0.3125rem] px-2 border border-solid cursor-pointer",
                "font-mono text-[0.6875rem] font-semibold leading-none tracking-[0.01em] transition-[color,border-color,background] duration-[140ms]",
                "[--fc:var(--line-2)]",
                on
                  ? "text-txt border-[var(--fc)] bg-[color-mix(in_srgb,var(--fc)_14%,transparent)]"
                  : "text-txt-muted bg-panel border-line hover:text-txt hover:border-line-2",
              )}
            >
              {o.color && <span className="w-2 h-2 rounded-full bg-[var(--fc)]" />}
              {o.label}
              {o.count != null && (
                <span className={cn("font-mono text-[0.5625rem] font-semibold leading-none", on ? "text-[var(--fc)]" : "text-txt-dim")}>
                  {o.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
