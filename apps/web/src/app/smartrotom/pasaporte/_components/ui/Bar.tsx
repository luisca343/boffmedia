// PAPER.

import { cn } from "@/lib/utils"

/**
 * A ruled progress bar, filled with the chapter's ink by default.
 *
 * The width is an inline style because it is a real number from the data, and the only
 * way to express it (`w-[${pct}%]` compiles to nothing). `fill` exists
 * for the Logros category bars, which are inked with fixed category colours rather than
 * with the chapter accent.
 */
export function Bar({
  value,
  max = 100,
  thin = false,
  fill,
  className,
  label,
}: {
  value: number
  max?: number
  thin?: boolean
  /** A literal class string (`bg-ps-teal`), never an interpolated one. */
  fill?: string
  className?: string
  /** Bars carry meaning, so give a screen reader the number, not just the colour. */
  label?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-md bg-ps-ink/[.14]",
        thin ? "h-[5px]" : "h-2",
        className,
      )}
    >
      <span
        style={{ width: `${pct}%` }}
        className={cn(
          "block h-full rounded-md",
          fill ?? "bg-gradient-to-r from-ps-chapter to-ps-chapter-deep",
        )}
      />
    </div>
  )
}
