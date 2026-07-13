"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

/**
 * The pill tab row (format tabs, order filters, seller-dashboard status tabs).
 * The active tab is the pink gradient — the SAME gradient as the primary button
 * (`wp-grad-primary`), which is what makes the chrome read as one object.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: ReadonlyArray<{ key: T; label: string; icon?: IconName; count?: number }>
  value: T
  onChange: (next: T) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 rounded-wp-pill border-wp border-wp-line/24 bg-white p-[5px] shadow-wp-soft",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-[7px] rounded-wp-pill px-4 py-2 font-wp text-[13px] font-extrabold",
              "transition-all duration-150 ease-wp-soft",
              active
                ? "wp-grad-primary text-white shadow-wp-tab"
                : "text-wp-fg-muted hover:text-wp-accent-strong",
            )}
          >
            {t.icon && <Icon name={t.icon} size={15} />}
            {t.label}
            {t.count !== undefined && <span className="opacity-55">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** The compact segmented control (grid/list density, Pokémon/Objeto/Lote). */
export function Seg<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: ReadonlyArray<{ key: T; label?: string; icon?: IconName; title?: string }>
  value: T
  onChange: (next: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex gap-[3px] rounded-wp-pill border-wp border-wp-line/24 bg-white p-[3px]",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.key === value
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            title={o.title}
            aria-label={o.title ?? o.label}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-wp-pill px-[13px] py-2 font-wp text-[13px] font-extrabold transition-colors",
              active ? "bg-wp-accent text-white" : "text-wp-fg-muted hover:text-wp-accent-strong",
            )}
          >
            {o.icon && <Icon name={o.icon} size={14} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The numbered stepper — the sell wizard and the escrow tracker share it.
 *
 * Three states, and the colour split is the point: the CURRENT step is accent pink
 * (this is where you are), a DONE step is green (this is settled). Escrow leans on
 * that hard — a green "Pago liberado" means the money genuinely moved.
 */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: readonly string[]
  /** Index of the active step. Pass -1 for an off-ramp (refunded), which greys all. */
  current: number
  className?: string
}) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center">
            {i > 0 && (
              <span
                className={cn(
                  "mx-2.5 h-[2.5px] w-[46px] rounded-wp-pill",
                  done || active ? "bg-wp-green" : "bg-wp-line/24",
                )}
              />
            )}
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-[30px] w-[30px] flex-none items-center justify-center rounded-wp-pill border-2 font-wp text-[13px] font-extrabold",
                  done
                    ? "border-wp-green bg-wp-green text-white"
                    : active
                      ? "border-wp-accent bg-wp-accent text-white"
                      : "border-wp-line/46 bg-white text-wp-fg-subtle",
                )}
              >
                {done ? <Icon name="check" size={14} stroke={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "font-wp text-[13px] font-semibold",
                  done || active ? "text-wp-fg" : "text-wp-fg-subtle",
                )}
              >
                {label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** The count bubble on a nav tab. */
export function NavBadge({
  children,
  tone = "teal",
  className,
}: {
  children: ReactNode
  tone?: "teal" | "gold" | "rose" | "accent"
  className?: string
}) {
  const TONE = {
    teal: "bg-wp-teal",
    gold: "bg-wp-gold",
    rose: "bg-wp-rose",
    accent: "bg-wp-accent",
  } as const
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-wp-pill border-2 border-white px-1",
        "wp-num font-wp text-[10px] leading-none text-white",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
