import * as React from "react"
import { cn } from "../cn"
import { useT } from "../i18n"
import { Icon } from "./icon"

function pagerItems(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const lo = Math.max(2, page - 1)
  const hi = Math.min(total - 1, page + 1)
  const out: (number | "…")[] = [1]
  if (lo > 2) out.push("…")
  for (let i = lo; i <= hi; i++) out.push(i)
  if (hi < total - 1) out.push("…")
  out.push(total)
  return out
}

const BTN = cn(
  "inline-grid place-items-center min-w-[2.125rem] h-[2.125rem] px-[0.375rem] cursor-pointer",
  "font-mono text-[0.75rem] font-semibold leading-none text-txt-muted bg-panel border border-solid border-line",
  "transition-[color,border-color,background] duration-[140ms]",
  "disabled:opacity-35 disabled:cursor-not-allowed",
  "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-2",
)

export interface PaginationProps {
  page: number
  total: number
  onChange?: (page: number) => void
  ariaLabel?: string
  className?: string
}

export function Pagination({ page, total, onChange, ariaLabel, className }: PaginationProps) {
  const t = useT()
  const resolvedAriaLabel = ariaLabel ?? t("pagination")
  const go = (p: number) => onChange?.(Math.min(total, Math.max(1, p)))
  return (
    <nav aria-label={resolvedAriaLabel} className={cn("inline-flex items-center gap-[0.3125rem]", className)}>
      <button type="button" className={BTN} disabled={page <= 1} aria-label={t("previousPage")} onClick={() => go(page - 1)}>
        <Icon name="back" size={14} />
      </button>
      {pagerItems(page, total).map((p, i) =>
        p === "…" ? (
          <span key={"e" + i} aria-hidden="true" className="font-mono text-[0.75rem] font-semibold leading-none text-txt-dim px-1">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            className={cn(
              BTN,
              p === page
                // The kit's bottom-right chamfer, the same one Button carries.
                // Not `.cut`, the slanted parallelogram: that leaves the current
                // page as the one leaning box in the whole pager.
                ? "bg-accent border-accent text-accent-ink cut-tag cut-tag-edge [--cut-line:var(--accent)] [--cut-tag:8px]"
                : "hover:enabled:text-txt hover:enabled:border-line-2",
            )}
          >
            {String(p).padStart(2, "0")}
          </button>
        ),
      )}
      <button type="button" className={BTN} disabled={page >= total} aria-label={t("nextPage")} onClick={() => go(page + 1)}>
        <Icon name="arrow" size={14} />
      </button>
    </nav>
  )
}
