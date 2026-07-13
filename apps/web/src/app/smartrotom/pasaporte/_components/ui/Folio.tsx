// PAPER. The furniture at the foot of every leaf.

import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/**
 * Page number and issuing authority in the OUTER corner (where a thumb finds it), the way
 * back to the index in the INNER one — so the two never collide across the gutter.
 */
export function Folio({
  side,
  page,
  onIndex,
  className,
}: {
  side: "left" | "right"
  /** Already formatted by the caller — a roman numeral, a folio code, whatever it is. */
  page: string
  onIndex?: () => void
  className?: string
}) {
  return (
    <>
      <span
        className={cn(
          "ps-num absolute bottom-4 font-ps-mono text-[11px] tracking-[.12em] text-ps-ink-faint",
          side === "left" ? "left-[30px]" : "right-[30px]",
          className,
        )}
      >
        {page} · GOB·TERAS
      </span>
      {onIndex && (
        <button
          type="button"
          onClick={onIndex}
          className={cn(
            "absolute bottom-3.5 inline-flex items-center gap-[5px] rounded-sm font-ps text-[11px] tracking-[.04em] text-ps-ink-faint",
            "transition-colors hover:text-ps-chapter-deep",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-chapter",
            side === "left" ? "right-[30px]" : "left-[30px]",
          )}
        >
          <Icon name="book" className="h-3.5 w-3.5" />
          Índice
        </button>
      )}
    </>
  )
}
