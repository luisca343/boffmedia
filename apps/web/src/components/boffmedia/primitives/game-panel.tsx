"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GamePanelProps {
  title?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Titled panel for game surfaces: header (title + actions), body, optional footer.
 */
export function GamePanel({ title, actions, footer, children, className, bodyClassName }: GamePanelProps) {
  return (
    <section
      className={cn("flex flex-col rounded-[var(--radius)] border border-[var(--border)] overflow-hidden", className)}
      style={{ background: "var(--card-bg)" }}
    >
      {(title || actions) && (
        <header
          className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]"
          style={{ background: "var(--surface-2)" }}
        >
          {title && (
            <h2 className="font-display font-bold text-t-sm min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {title}
            </h2>
          )}
          {actions && <div className="ml-auto flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("flex-1 min-h-0", bodyClassName)}>{children}</div>
      {footer && (
        <footer className="px-3 py-2 border-t border-[var(--border)]" style={{ background: "var(--surface-2)" }}>
          {footer}
        </footer>
      )}
    </section>
  )
}
