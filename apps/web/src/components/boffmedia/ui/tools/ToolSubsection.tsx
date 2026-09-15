"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ToolGrid } from "./ToolGrid"
import type { ToolCardData } from "@boffmedia/ui"

export interface ToolSubsectionProps {
  id?: string
  title: React.ReactNode
  tools: ToolCardData[]
  count?: React.ReactNode
  /** One-based position in the parent catalogue. */
  index?: number
  variant?: "senal" | "fila"
  className?: string
}

/**
 * A catalogue subsection: a lighter-weight boundary than `TxSection` that
 * keeps the parent heading in charge while giving each category its own
 * rhythm, index and tool count.
 */
export function ToolSubsection({
  id,
  title,
  tools,
  count,
  index,
  variant = "fila",
  className,
}: ToolSubsectionProps) {
  const generatedId = React.useId()
  const headingId = id ?? `tool-subsection-${generatedId}`
  const marker = index == null ? null : String(index).padStart(2, "0")

  return (
    <section aria-labelledby={headingId} className={cn("relative", className)}>
      <header className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          {marker && (
            <span
              aria-hidden="true"
              className="grid h-7 min-w-[1.75rem] flex-none place-items-center border border-[color-mix(in_srgb,var(--accent)_42%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-1.5 font-mono text-[0.625rem] font-bold leading-none tracking-[0.1em] text-accent"
            >
              {marker}
            </span>
          )}
          <h3
            id={headingId}
            className="min-w-0 font-display text-[clamp(1.35rem,2.5vw,1.75rem)] font-extrabold italic uppercase leading-[0.95] tracking-[0.01em]"
          >
            {title}
          </h3>
        </div>
        {count != null && <span className="mono-label flex-none">{count}</span>}
      </header>
      <ToolGrid tools={tools} variant={variant} />
    </section>
  )
}
