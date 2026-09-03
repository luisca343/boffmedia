import * as React from "react"
import { useNsT } from "../i18n"
import { cn } from "../cn"
import { Icon, SearchInput, type IconName } from "../primitives"

export interface DkSegOption {
  value: string
  label: React.ReactNode
  count?: number
}

export interface DkSegProps {
  options: DkSegOption[]
  value: string
  onChange: (value: string) => void
  size?: "sm"
  ariaLabel?: string
  className?: string
}

export function DkSeg({ options, value, onChange, size, ariaLabel, className }: DkSegProps) {
  const sm = size === "sm"
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:8px] ", "inline-flex border border-solid border-line-2 bg-base", className)}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-[0.375rem] whitespace-nowrap border-0 font-mono font-semibold uppercase leading-none tracking-[0.06em] transition-[color,background]",
              sm ? "px-[0.625rem] py-[0.4375rem] text-[0.625rem]" : "px-[0.8125rem] py-[0.5625rem] text-[0.6875rem]",
              on ? "bg-accent text-accent-ink" : "text-txt-muted hover:text-txt",
            )}
          >
            {o.label}
            {o.count != null && (
              <span className="bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-[0.3125rem] py-[2px] text-[0.5625rem]">{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export interface DkSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
}

/** The datakit's name for the shared `SearchInput` at bar density. The field
 *  itself (chamfer, focus ring, clear button, Escape-to-clear) has one
 *  definition in this package's primitives; only the namespaced placeholder is
 *  local. */
export function DkSearch({ value, onChange, placeholder, ariaLabel, className }: DkSearchProps) {
  const t = useNsT("common.dkExtras")
  const ph = placeholder ?? t("searchPh")
  return (
    <SearchInput
      size="sm"
      value={value}
      onChange={onChange}
      placeholder={ph}
      ariaLabel={ariaLabel ?? ph}
      className={cn("min-w-0", className)}
    />
  )
}

export function DkChip({ icon, tone, children, className }: { icon?: IconName; tone?: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      style={{  color: tone }}
      className={cn("cut cut-edge-slant [--cut:3px]", "inline-flex items-center gap-[0.375rem] whitespace-nowrap border border-solid border-line bg-panel px-[0.5625rem] py-[0.375rem] font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.08em]",
        !tone && "text-txt-muted",
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
