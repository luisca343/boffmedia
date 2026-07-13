import { cn } from "@/lib/utils"
import { typeColor } from "../../_utils/typeColors"

/**
 * A Pokémon type pill. The fill is data-driven so it goes through inline `style`
 * (§4) — and it carries a glow in its own hue, which is what stops eighteen flat
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
        size === "sm" ? "px-[7px] py-0.5 text-[10px]" : "px-[9px] py-[3px] text-[11px]",
        className,
      )}
      style={{ background: c, color: t, boxShadow: `0 2px 8px -2px ${c}99` }}
    >
      {type}
    </span>
  )
}
