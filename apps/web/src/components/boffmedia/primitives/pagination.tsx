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
    <nav className={cn("inline-flex items-center gap-1", className)} aria-label="Paginación">
      <button
        className={cn(
          "grid place-items-center min-w-[38px] h-[38px] px-2",
          "rounded-[var(--radius,14px)]",
          "border border-solid border-edge",
          "bg-layer-2 text-ink-muted",
          "font-mono text-sm font-semibold",
          "cursor-pointer",
          "transition-all duration-[var(--dur,0.32s)]",
          "hover:not-disabled:text-ink hover:not-disabled:border-edge-strong",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        )}
        disabled={page === 1}
        onClick={() => go(page - 1)}
        aria-label="Anterior"
      >
        <Icon name="chevron" size={16} style={{ transform: "rotate(90deg)" }} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="text-ink-dim px-0.5">…</span>
        ) : (
          <button
            key={p}
            className={cn(
              "grid place-items-center min-w-[38px] h-[38px] px-2",
              "rounded-[var(--radius,14px)]",
              "border border-solid border-edge",
              "bg-layer-2 text-ink-muted",
              "font-mono text-sm font-semibold",
              "cursor-pointer",
              "transition-all duration-[var(--dur,0.32s)]",
              "hover:not-disabled:text-ink hover:not-disabled:border-edge-strong",
              p === page && "text-[var(--on-secondary)] bg-secondary border-secondary",
            )}
            onClick={() => go(p as number)}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        className={cn(
          "grid place-items-center min-w-[38px] h-[38px] px-2",
          "rounded-[var(--radius,14px)]",
          "border border-solid border-edge",
          "bg-layer-2 text-ink-muted",
          "font-mono text-sm font-semibold",
          "cursor-pointer",
          "transition-all duration-[var(--dur,0.32s)]",
          "hover:not-disabled:text-ink hover:not-disabled:border-edge-strong",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        )}
        disabled={page === total}
        onClick={() => go(page + 1)}
        aria-label="Siguiente"
      >
        <Icon name="chevron" size={16} style={{ transform: "rotate(-90deg)" }} />
      </button>
    </nav>
  )
}
