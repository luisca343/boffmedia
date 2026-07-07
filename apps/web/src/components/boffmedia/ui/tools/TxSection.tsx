import * as React from "react"
import { cn } from "@/lib/utils"

export interface TxSectionProps {
  title: React.ReactNode
  count?: React.ReactNode
  hint?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Standardised section block: accent-barred heading · dashed thread · mono count · actions slot. */
export function TxSection({ title, count, hint, actions, className, children }: TxSectionProps) {
  return (
    <section className={cn("mt-11 first:mt-0", className)}>
      <div className="mb-[18px] flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="relative flex-none pl-[15px] font-display text-[clamp(24px,4vw,30px)] font-extrabold italic uppercase leading-[0.92] before:absolute before:left-0 before:top-[0.14em] before:bottom-[0.06em] before:w-1 before:bg-gradient-to-b before:from-accent before:to-[color-mix(in_srgb,var(--accent)_30%,transparent)] before:content-['']">
          {title}
        </h2>
        <span aria-hidden="true" className="min-w-0 flex-1 border-t border-dashed border-line" />
        {hint && (
          <span className="inline-flex flex-none items-center gap-[7px] font-mono text-[10.5px] uppercase leading-none tracking-[0.08em] text-txt-dim [&_svg]:text-signal">
            {hint}
          </span>
        )}
        {count != null && <span className="mono-label flex-none">{count}</span>}
        {actions}
      </div>
      {children}
    </section>
  )
}
