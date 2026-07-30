import * as React from "react"
import { cn } from "../cn"

export interface Crumb {
  label: React.ReactNode
  href?: string
}

export interface CrumbsProps {
  items: Crumb[]
  className?: string
}

export function Crumbs({ items, className }: CrumbsProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-[10px] font-mono text-[11px] font-medium leading-none uppercase tracking-[0.1em] text-txt-dim",
        className,
      )}
    >
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-line-2">/</span>}
          {it.href ? (
            <a href={it.href} className="text-txt-muted hover:text-accent-bright">
              {it.label}
            </a>
          ) : (
            <span className="text-txt">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
