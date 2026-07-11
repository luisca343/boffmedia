"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"

// Mono data chip with a tinted glyph — the «detail strip» of an event
// (starts · type · game…). Mirrors `.ev-meta` from eventos.css.
export function MetaChip({
  icon,
  label,
  value,
  hue,
  className,
}: {
  icon: IconName
  label: React.ReactNode
  value: React.ReactNode
  /** [deferred] per-game hue tint for the glyph; falls back to the brand accent. */
  hue?: string | null
  className?: string
}) {
  return (
    <div
      style={hue ? ({ ["--ghue" as string]: hue } as React.CSSProperties) : undefined}
      className={cn("flex items-center gap-[11px] border border-solid border-line bg-panel px-[15px] py-[11px]", className)}
    >
      <Icon name={icon} size={15} className="flex-none text-[color:var(--ghue,var(--accent))]" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[9.5px]/none font-medium uppercase tracking-[0.13em] text-txt-muted">{label}</span>
        <span className="font-display text-[14px]/none font-bold uppercase tracking-[0.02em]">{value}</span>
      </div>
    </div>
  )
}
