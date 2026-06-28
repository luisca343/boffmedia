"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface StatProps {
  icon?: string
  label: string
  value: string
  delta?: string
  deltaTone?: "up" | "down"
  sub?: string
  className?: string
}

export function Stat({ icon, label, value, delta, deltaTone = "up", sub, className }: StatProps) {
  return (
    <div
      className={cn("p-5", className)}
      style={{
        borderRadius: "var(--radius-lg, 22px)",
        border: "var(--card-border)",
        background: "var(--card-bg)",
      }}
    >
      <div className="flex items-center justify-between mb-3.5">
        {icon && (
          <span className="grid place-items-center w-[38px] h-[38px] rounded-[var(--radius,14px)] text-orange-500 bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)]">
            <Icon name={icon} size={18} />
          </span>
        )}
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              "font-mono text-xs font-bold",
              "py-0.5 px-2",
              "rounded-[var(--radius-pill,9999px)]",
              deltaTone === "up" ? "text-emerald-400 bg-[color-mix(in_srgb,var(--emerald-500)_14%,transparent)]" : "text-rose-400 bg-[color-mix(in_srgb,var(--rose-500)_14%,transparent)]",
            )}
          >
            <Icon name={deltaTone === "down" ? "arrow" : "trending"} size={13} className={deltaTone === "down" ? "rotate-90" : ""} />
            {delta}
          </span>
        )}
      </div>
      <div className="font-display font-extrabold text-3xl leading-none">{value}</div>
      <div className="text-sm font-semibold text-ink-muted mt-1">{label}</div>
      {sub && <div className="text-xs mt-0.5 text-ink-dim">{sub}</div>}
    </div>
  )
}
