"use client"

import { type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import type { SchStatus } from "./lib"

export interface FilterChip {
  key: SchStatus
  label: string
  count: number
}

export interface FilterChipsProps {
  chips: FilterChip[]
  active: SchStatus | null
  onToggle: (key: SchStatus) => void
}

const CHIP_COLOR: Record<SchStatus, string> = {
  safe: "var(--emerald-400)",
  renamed: "var(--amber-400)",
  "state-changed": "var(--amber-400)",
  missing: "var(--rose-400)",
  "mod-only": "var(--rose-400)",
}

// Count chips that filter a list by status. Each chip carries a coloured LED,
// the mono count and a label. Activating one dims the rest; zero-count disables.
export function FilterChips({ chips, active, onToggle }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-[0.45rem]">
      {chips.map((c) => {
        const on = active === c.key
        const dim = active !== null && !on
        return (
          <button
            key={c.key}
            type="button"
            title={c.label}
            disabled={c.count === 0}
            onClick={() => onToggle(c.key)}
            style={{ "--c": CHIP_COLOR[c.key] } as CSSProperties}
            className={cn(
              "inline-flex items-center gap-[0.45rem] py-[0.32rem] px-[0.6rem] rounded-[var(--radius-pill)]",
              "border text-[length:var(--t-xs)] cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)]",
              "disabled:opacity-40 disabled:cursor-default",
              on
                ? "border-[var(--c)] bg-[color-mix(in_srgb,var(--c)_14%,var(--layer-2))]"
                : "border-edge bg-layer-2 text-ink-muted enabled:hover:border-edge-strong enabled:hover:bg-layer-3",
              dim && "opacity-45",
            )}
          >
            <span className="w-2 h-2 rounded-full shrink-0 bg-[var(--c)]" />
            <span className="font-mono font-bold text-ink tabular-nums">{c.count}</span>
            <span className={on ? "text-ink-muted" : "text-ink-dim"}>{c.label}</span>
          </button>
        )
      })}
    </div>
  )
}
