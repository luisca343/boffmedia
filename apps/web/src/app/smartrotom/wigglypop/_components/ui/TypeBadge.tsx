import { cn } from "@/lib/utils"
import { typeColor } from "../../_utils/typeColors"

/**
 * A Pokémon type pill. The fill is data-driven so it goes through inline `style`
 * — and it carries a glow in its own hue, which is what stops eighteen flat
 * pills from looking like a stack of stickers on the white card.
 */
export function TypeBadge({
  type,
  size = "md",
  className,
}: {
  type: string
  size?: "sm" | "md"
  className?: string
}) {
  const { c, t } = typeColor(type)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-wp-pill font-wp font-extrabold capitalize tracking-[.02em]",
        size === "sm" ? "px-[0.4375rem] py-0.5 text-[0.625rem]" : "px-[0.5625rem] py-[3px] text-[0.6875rem]",
        className,
      )}
      style={{ background: c, color: t, boxShadow: `0 2px 8px -2px ${c}99` }}
    >
      {type}
    </span>
  )
}
