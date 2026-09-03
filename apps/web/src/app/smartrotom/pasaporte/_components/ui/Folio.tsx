// PAPER. The furniture at the foot of every leaf.

import { useTranslations } from "next-intl"
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
  const t = useTranslations("pasaporte")
  return (
    <>
      <span
        className={cn(
          "ps-num absolute bottom-4 font-ps-mono text-[0.6875rem] tracking-[.12em] text-ps-ink-faint",
          side === "left" ? "left-[1.875rem]" : "right-[1.875rem]",
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
            "absolute bottom-3.5 inline-flex items-center gap-[0.3125rem] rounded-sm font-ps text-[0.6875rem] tracking-[.04em] text-ps-ink-faint",
            "transition-colors hover:text-ps-chapter-deep",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-chapter",
            side === "left" ? "right-[1.875rem]" : "left-[1.875rem]",
          )}
        >
          <Icon name="book" className="h-3.5 w-3.5" />
          {t("indice.title")}
        </button>
      )}
    </>
  )
}
