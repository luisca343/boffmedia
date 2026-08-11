import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { DK_CUT } from "./utils"

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
              "inline-flex items-center gap-[6px] whitespace-nowrap border-0 font-mono font-semibold uppercase leading-none tracking-[0.06em] transition-[color,background]",
              sm ? "px-[10px] py-[7px] text-[10px]" : "px-[13px] py-[9px] text-[11px]",
              on ? "bg-accent text-accent-ink" : "text-txt-muted hover:text-txt",
            )}
          >
            {o.label}
            {o.count != null && (
              <span className="bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-[5px] py-[2px] text-[9px]">{o.count}</span>
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

export function DkSearch({ value, onChange, placeholder, ariaLabel, className }: DkSearchProps) {
  const t = useTranslations("common.dkExtras")
  const ph = placeholder ?? t("searchPh")
  return (
    <div
      className={cn("cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:8px] ", "inline-flex min-w-0 items-center gap-2 border border-solid border-line-2 bg-base px-[10px] text-txt-dim transition-[border-color] focus-within:border-accent",
        className,
      )}
    >
      <Icon name="search" size={15} className="flex-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        aria-label={ariaLabel ?? ph}
        className="min-w-0 flex-1 border-0 bg-transparent py-[9px] font-body text-[13px] font-medium leading-none text-txt outline-none placeholder:text-txt-dim"
      />
      {value && (
        <button
          type="button"
          aria-label={t("clear")}
          onClick={() => onChange("")}
          className="grid place-items-center p-1 text-txt-dim transition-colors hover:text-txt"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}

export function DkChip({ icon, tone, children, className }: { icon?: IconName; tone?: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      style={{  color: tone }}
      className={cn("cut cut-edge-slant [--cut:3px]", "inline-flex items-center gap-[6px] whitespace-nowrap border border-solid border-line bg-panel px-[9px] py-[6px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.08em]",
        !tone && "text-txt-muted",
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
