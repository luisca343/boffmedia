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
    <nav className={cn("crumb", className)} aria-label="Ruta">
      {items.map((it, i) => (
        <span key={i} className="crumb__seg">
          {i > 0 && <Icon name="chevron" size={14} className="crumb__sep" style={{ transform: "rotate(-90deg)" }} />}
          {it.href && i < items.length - 1
            ? <a href={it.href} className="crumb__link" onClick={(e) => { e.preventDefault(); go && go(it.href!.replace(/^#/, "")) }}>{it.label}</a>
            : <span className="crumb__current">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}
