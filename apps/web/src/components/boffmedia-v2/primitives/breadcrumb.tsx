"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface BreadcrumbItem { label: string; href?: string }

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  go?: (path: string) => void
  className?: string
}

export function Breadcrumb({ items, go, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center flex-wrap gap-px text-sm mb-6", className)} aria-label="Ruta">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-px">
          {i > 0 && <Icon name="chevron" size={14} className="text-ink-dim mx-1" style={{ transform: "rotate(-90deg)" }} />}
          {it.href && i < items.length - 1
            ? <a href={it.href} className="text-ink-muted transition-colors duration-[var(--dur,0.32s)] hover:text-orange-500" onClick={(e) => { e.preventDefault(); go && go(it.href!.replace(/^#/, "")) }}>{it.label}</a>
            : <span className="text-ink font-semibold">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}
