import { cn } from "@/lib/utils"
import { fmt } from "../../_utils/format"

/**
 * Every ₽ figure in the app. The whole point of this component existing is that a
 * price is NEVER just formatted text:
 *
 * · the ₽ glyph is **teal** (money's colour in this system) while the amount is ink,
 *   so a price is scannable in a wall of pink without shouting;
 * · the amount is tabular (`wp-num`), so a column of prices aligns on the decimal.
 *
 * Anything numeric that is not money (a level, an IV, a count) uses `wp-num`
 * directly and must NOT come through here — the teal ₽ is what makes money money.
 */

export interface PriceProps {
  amount: number
  /** px. The design ranges from 14 (table cell) to 34 (the offer modal's hero). */
  size?: number
  /** Override the ₽ glyph's colour. The valuation box tints it teal-on-teal. */
  symbolClassName?: string
  className?: string
}

export function Price({ amount, size = 16, symbolClassName, className }: PriceProps) {
  return (
    <span
      className={cn("wp-num inline-flex items-baseline font-wp text-wp-fg", className)}
      style={{ fontSize: size }}
    >
      <span className={cn("mr-px font-black text-wp-teal", symbolClassName)}>₽</span>
      {fmt(amount)}
    </span>
  )
}
