import type { IconName } from "../_components/ui/Icon"
import type { WpFormat, WpListingStatus, WpOrderStatus } from "../_types/market.types"

/** The four ways a thing can be sold. Labels are the handoff's, verbatim. */
export const FORMAT_LABEL: Record<WpFormat, string> = {
  fixed: "Cómpralo ya",
  auction: "Subasta",
  offer: "Mejor oferta",
  trade: "Intercambio",
}

export const FORMAT_ICON: Record<WpFormat, IconName> = {
  fixed: "cart",
  auction: "gavel",
  offer: "handshake",
  trade: "swap",
}

export const FORMAT_HINT: Record<WpFormat, string> = {
  fixed: "Precio fijo, venta inmediata",
  auction: "Los compradores pujan",
  offer: "Acepta ofertas y negocia",
  trade: "Cambia por otros Pokémon",
}

/** Seller-side listing state (Mis anuncios). */
export const LISTING_STATUS: Record<
  WpListingStatus,
  { label: string; text: string; bg: string }
> = {
  activo: { label: "Activo", text: "text-wp-green", bg: "bg-wp-green/15" },
  pausado: { label: "Pausado", text: "text-wp-amber", bg: "bg-wp-amber/15" },
  vendido: { label: "Vendido", text: "text-wp-accent", bg: "bg-wp-accent/[.13]" },
  cancelado: { label: "Cancelado", text: "text-wp-rose", bg: "bg-wp-rose/12" },
}

/**
 * Buyer-side order state. These four map onto the escrow tracker's three steps:
 * `escrow` = paid & held, `transferido` = the seller says they handed it over,
 * `completado` = the buyer confirmed and the money was released. `reembolsado`
 * is the off-ramp. The label on `transferido` is an imperative on purpose — at
 * that step the ball is in the *buyer's* court, and the card is asking for a click.
 */
export const ORDER_STATUS: Record<
  WpOrderStatus,
  { label: string; text: string; bg: string }
> = {
  escrow: { label: "Pago en depósito", text: "text-wp-teal", bg: "bg-wp-teal/14" },
  transferido: { label: "Confirma recepción", text: "text-wp-gold", bg: "bg-wp-gold/[.16]" },
  completado: { label: "Completado", text: "text-wp-green", bg: "bg-wp-green/14" },
  cancelado: { label: "Cancelado", text: "text-wp-rose", bg: "bg-wp-rose/12" },
  reembolsado: { label: "Reembolsado", text: "text-wp-rose", bg: "bg-wp-rose/12" },
}

export const ESCROW_STEPS = ["Pago retenido", "Transferencia PC", "Pago liberado"] as const

/** Which of the three tracker steps an order is standing on. -1 = refunded/off-ramp. */
export function escrowStep(status: WpOrderStatus): number {
  if (status === "cancelado" || status === "reembolsado") return -1
  if (status === "completado") return 2
  if (status === "transferido") return 1
  return 0
}

/** ₽ with es-ES grouping. Every figure in the app goes through this. */
export const fmt = (n: number): string =>
  new Intl.NumberFormat("es-ES").format(Math.round(n))

/** "hace 4 min" / "hace 3 h" / "hace 2 d". */
export function timeAgo(iso: string | number | Date): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return "ahora"
  const min = Math.floor(secs / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

/** An auction's remaining time. Under an hour it counts seconds and turns urgent. */
export function countdown(endsAt: string | Date): { text: string; urgent: boolean; over: boolean } {
  const secs = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)
  if (secs <= 0) return { text: "Finalizada", urgent: false, over: true }
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (d > 0) return { text: `${d}d ${h}h`, urgent: false, over: false }
  const pad = (n: number) => String(n).padStart(2, "0")
  return { text: `${pad(h)}:${pad(m)}:${pad(s)}`, urgent: secs < 3600, over: false }
}
