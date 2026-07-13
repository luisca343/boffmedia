"use client"

// DESK. The controls lie on the walnut, under the book.

import { cn } from "@/lib/utils"
import { Icon, NavButton } from "./ui"

/**
 * The nav pill and the scrubber. One scrubber segment per leaf: lit once visited, struck
 * gold on the current one — a physical read of how far into the document you are.
 */
export function Controls({
  page,
  total,
  visited,
  onPrev,
  onNext,
  onFlip,
}: {
  page: number
  total: number
  visited: Set<number>
  onPrev: () => void
  onNext: () => void
  onFlip: (page: number) => void
}) {
  const last = Math.max(0, total - 1)

  return (
    <footer className="z-40 flex flex-wrap items-center justify-center gap-3.5 px-4 py-3.5">
      <div className="flex items-center gap-1 rounded-full border border-ps-gild/18 bg-ps-desk-lo/50 p-[5px]">
        <NavButton aria-label="Página anterior" onClick={onPrev} disabled={page <= 0}>
          <Icon name="chevL" className="h-[19px] w-[19px]" />
        </NavButton>

        <p className="ps-num min-w-[92px] text-center font-ps-mono text-[12px] tracking-[.08em] text-ps-chrome-muted">
          <b className="font-bold text-ps-gild-hi">{String(page).padStart(2, "0")}</b> /{" "}
          {String(last).padStart(2, "0")}
        </p>

        <NavButton aria-label="Página siguiente" onClick={onNext} disabled={page >= last}>
          <Icon name="chevR" className="h-[19px] w-[19px]" />
        </NavButton>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a la página ${i}`}
            aria-current={i === page ? "page" : undefined}
            onClick={() => onFlip(i)}
            className={cn(
              "h-1 w-[22px] rounded-sm transition-colors duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-gild focus-visible:ring-offset-2 focus-visible:ring-offset-ps-desk",
              i === page
                ? "bg-ps-gild shadow-[0_0_8px_rgb(var(--ps-gild)/.55)]"
                : visited.has(i)
                  ? "bg-ps-gild-lo"
                  : "bg-ps-desk-hi",
            )}
          />
        ))}
      </div>
    </footer>
  )
}
