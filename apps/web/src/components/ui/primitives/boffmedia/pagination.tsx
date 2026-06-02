"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface PaginationProps {
  page: number
  total: number
  onChange: (page: number) => void
  className?: string
}

export function Pagination({ page, total, onChange, className }: PaginationProps) {
  const go = (p: number) => { if (p >= 1 && p <= total) onChange(p) }
  const pages: (number | string)[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== "…") pages.push("…")
  }

  return (
    <nav className={cn("k-pager", className)} aria-label="Paginación">
      <button className="k-pager__btn" disabled={page === 1} onClick={() => go(page - 1)} aria-label="Anterior">
        <Icon name="chevron" size={16} style={{ transform: "rotate(90deg)" }} />
      </button>
      {pages.map((p, i) => p === "…"
        ? <span key={`e${i}`} className="k-pager__gap">…</span>
        : <button key={p} className={cn("k-pager__btn", p === page && "k-pager__btn--on")} onClick={() => go(p as number)} aria-current={p === page ? "page" : undefined}>{p}</button>
      )}
      <button className="k-pager__btn" disabled={page === total} onClick={() => go(page + 1)} aria-label="Siguiente">
        <Icon name="chevron" size={16} style={{ transform: "rotate(-90deg)" }} />
      </button>
    </nav>
  )
}
