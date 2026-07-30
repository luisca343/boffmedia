import type { IconName } from "../_components/ui/Icon"
import type { WpFormat, WpListingStatus, WpOrderStatus } from "../_types/market.types"

/** The four ways a thing can be sold. Values are i18n key suffixes, not text — resolve with `t()`. */
export const FORMAT_LABEL_KEY: Record<WpFormat, string> = {
  fixed: "status.format.fixed.label",
  auction: "status.format.auction.label",
  offer: "status.format.offer.label",
  trade: "status.format.trade.label",
}

export const FORMAT_ICON: Record<WpFormat, IconName> = {
  fixed: "cart",
  auction: "gavel",
  offer: "handshake",
  trade: "swap",
}

export const FORMAT_HINT_KEY: Record<WpFormat, string> = {
  fixed: "status.format.fixed.hint",
  auction: "status.format.auction.hint",
  offer: "status.format.offer.hint",
  trade: "status.format.trade.hint",
}

/** Seller-side listing state (Mis anuncios). `key` resolves the label via `t()`. */
export const LISTING_STATUS_STYLE: Record<
  WpListingStatus,
  { key: string; text: string; bg: string }
> = {
  activo: { key: "status.listing.activo", text: "text-wp-green", bg: "bg-wp-green/15" },
  pausado: { key: "status.listing.pausado", text: "text-wp-amber", bg: "bg-wp-amber/15" },
  vendido: { key: "status.listing.vendido", text: "text-wp-accent", bg: "bg-wp-accent/[.13]" },
  cancelado: { key: "status.listing.cancelado", text: "text-wp-rose", bg: "bg-wp-rose/12" },
}

/**
 * Buyer-side order state. These four map onto the escrow tracker's three steps:
 * `escrow` = paid & held, `transferido` = the seller says they handed it over,
 * `completado` = the buyer confirmed and the money was released. `reembolsado`
 * is the off-ramp. The label on `transferido` is an imperative on purpose — at
 * that step the ball is in the *buyer's* court, and the card is asking for a click.
 * `key` resolves the label via `t()`.
 */
export const ORDER_STATUS_STYLE: Record<
  WpOrderStatus,
  { key: string; text: string; bg: string }
> = {
  escrow: { key: "status.order.escrow", text: "text-wp-teal", bg: "bg-wp-teal/14" },
  transferido: { key: "status.order.transferido", text: "text-wp-gold", bg: "bg-wp-gold/[.16]" },
  completado: { key: "status.order.completado", text: "text-wp-green", bg: "bg-wp-green/14" },
  cancelado: { key: "status.order.cancelado", text: "text-wp-rose", bg: "bg-wp-rose/12" },
  reembolsado: { key: "status.order.reembolsado", text: "text-wp-rose", bg: "bg-wp-rose/12" },
}

export const ESCROW_STEP_KEYS = [
  "status.escrowStep.held",
  "status.escrowStep.transfer",
  "status.escrowStep.released",
] as const

/** Which of the three tracker steps an order is standing on. -1 = refunded/off-ramp. */
export function escrowStep(status: WpOrderStatus): number {
  if (status === "cancelado" || status === "reembolsado") return -1
  if (status === "completado") return 2
  if (status === "transferido") return 1
  return 0
}

// Every figure in the app goes through `fmt` (locale-aware grouping, no symbol).
export { formatNumber as fmt, timeAgo } from "@boffmedia/ui/format"

/** An auction's remaining time. Under an hour it counts seconds and turns urgent.
 *  `overLabel` is the caller's translated string for the "ended" state. */
export function countdown(
  endsAt: string | Date,
  overLabel: string,
): { text: string; urgent: boolean; over: boolean } {
  const secs = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)
  if (secs <= 0) return { text: overLabel, urgent: false, over: true }
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (d > 0) return { text: `${d}d ${h}h`, urgent: false, over: false }
  const pad = (n: number) => String(n).padStart(2, "0")
  return { text: `${pad(h)}:${pad(m)}:${pad(s)}`, urgent: secs < 3600, over: false }
}
