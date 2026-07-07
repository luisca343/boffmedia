import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export interface OptionItem {
  value: string
  icon?: string
  label: React.ReactNode
  sub?: React.ReactNode
  disabled?: boolean
}

export interface OptionCardProps {
  icon?: string
  label: React.ReactNode
  sub?: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaRole?: "radio" | "checkbox"
}

export function OptionCard({ icon, label, sub, active, disabled, onClick, ariaRole = "radio" }: OptionCardProps) {
  return (
    <button
      type="button"
      role={ariaRole}
      aria-checked={active}
      disabled={disabled}
      title={typeof sub === "string" ? sub : typeof label === "string" ? label : undefined}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-[6px] p-3 text-left cursor-pointer min-w-0 border border-solid",
        "cut",
        "transition-[border-color,color,background] duration-[140ms]",
        "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "border-accent bg-accent-soft text-txt"
          : "border-line bg-panel text-txt-muted hover:enabled:border-line-2 hover:enabled:text-txt",
      )}
    >
      {icon && (
        <span
          className={cn(
            "grid place-items-center w-[30px] h-[30px] cut [--cut:5px]",
            active
              ? "text-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
              : "text-txt-muted bg-[color-mix(in_srgb,var(--muted)_10%,transparent)]",
          )}
        >
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="font-display text-[14px] font-bold leading-[1.1] tracking-[0.02em] uppercase text-txt">{label}</span>
      {sub && <span className="font-mono text-[11px] leading-[1.3] text-txt-dim">{sub}</span>}
    </button>
  )
}

export interface OptionGroupProps {
  options: OptionItem[]
  value: string | string[]
  onChange?: (value: string | string[]) => void
  multi?: boolean
  columns?: number
  ariaLabel?: string
  className?: string
}

export function OptionGroup({ options, value, onChange, multi = false, columns, ariaLabel, className }: OptionGroupProps) {
  const vals = multi ? (Array.isArray(value) ? value : []) : value
  const isOn = (v: string) => (multi ? (vals as string[]).indexOf(v) >= 0 : vals === v)
  const toggle = (v: string) => {
    if (!onChange) return
    if (multi) onChange(isOn(v) ? (vals as string[]).filter((x) => x !== v) : (vals as string[]).concat([v]))
    else onChange(v)
  }
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      style={columns ? ({ ["--optcols" as string]: columns } as React.CSSProperties) : undefined}
      className={cn("grid grid-cols-[repeat(var(--optcols,3),minmax(0,1fr))] gap-2", className)}
    >
      {options.map((o) => (
        <OptionCard
          key={o.value}
          icon={o.icon}
          label={o.label}
          sub={o.sub}
          active={isOn(o.value)}
          disabled={o.disabled}
          ariaRole={multi ? "checkbox" : "radio"}
          onClick={() => toggle(o.value)}
        />
      ))}
    </div>
  )
}
