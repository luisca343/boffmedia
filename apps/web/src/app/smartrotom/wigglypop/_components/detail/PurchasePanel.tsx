"use client"

import type { WpListing } from "../../_types/market.types"
import { fmt } from "../../_utils/format"
import { useCartStore } from "../../_stores/cartStore"
import { useWpUuid } from "../../_hooks/queries"
import { Button, Chip, Countdown, Icon, Price, toast } from "../ui"

/**
 * The one panel that differs per sale format — and the reason the detail page is not
 * four pages. Each format asks for a fundamentally different commitment:
 *
 * · fixed  → pay now (or basket it)
 * · offer  → pay now, OR name your price
 * · auction→ bid, with a buy-now escape hatch if the seller set one
 * · trade  → no money at all; you offer a Pokémon back
 */
export function PurchasePanel({
  listing: L,
  onBuy,
  onOffer,
  onBid,
  onTrade,
}: {
  listing: WpListing
  onBuy: () => void
  onOffer: () => void
  onBid: () => void
  onTrade: () => void
}) {
  const uuid = useWpUuid()
  const addToCart = useCartStore((s) => s.add)
  const valDelta = L.value > 0 ? Math.round(((L.price - L.value) / L.value) * 100) : 0

  // `POST /orders` rejects buying your own listing ("You cannot buy your own
  // listing"), so don't offer the button and then fail — say so, and point the
  // seller at the one thing they CAN do here, which is reprice it.
  if (uuid && L.seller.uuid === uuid) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
            Tu anuncio
          </div>
          <Price amount={L.format === "auction" ? (L.currentBid ?? L.price) : L.price} size={30} />
        </div>
        <Chip>
          <Icon name="tag" size={12} />
          No puedes comprarte a ti mismo
        </Chip>
      </div>
    )
  }

  if (L.format === "auction") {
    const bid = L.currentBid ?? L.price
    const next = bid + (L.minIncrement ?? 50)
    return (
      <div>
        <div className="mb-3.5 flex items-start justify-between">
          <div>
            <div className="font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
              Puja actual · {L.bids ?? 0} {L.bids === 1 ? "puja" : "pujas"}
            </div>
            <Price amount={bid} size={30} />
          </div>
          {L.endsAt && (
            <div className="text-right">
              <div className="mb-1 font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
                Termina en
              </div>
              <Countdown endsAt={L.endsAt} />
            </div>
          )}
        </div>
        <div className="flex gap-2.5">
          <Button variant="primary" className="flex-1 py-[13px]" onClick={onBid}>
            <Icon name="gavel" size={17} />
            Pujar ₽{fmt(next)}
          </Button>
          {L.buyNow && (
            <Button className="px-4 py-[13px]" onClick={onBuy}>
              Cómpralo ya · ₽{fmt(L.buyNow)}
            </Button>
          )}
        </div>
        <div className="mt-2.5 font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
          Incremento mínimo ₽{fmt(L.minIncrement ?? 50)} · pago protegido en depósito
        </div>
      </div>
    )
  }

  if (L.format === "trade") {
    return (
      <div>
        <div className="mb-2 font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
          Intercambio · este vendedor busca
        </div>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {(L.wants ?? []).map((w) => (
            <Chip key={w} className="border-wp-teal/30 px-3 py-[7px] text-[13px] text-wp-teal-deep">
              <Icon name="swap" size={13} />
              {w}
            </Chip>
          ))}
          {L.tradePlus && <Chip className="px-3 py-[7px] text-[13px]">+ compensación ₽</Chip>}
        </div>
        <Button variant="primary" className="w-full py-[13px]" onClick={onTrade}>
          <Icon name="swap" size={17} />
          Proponer intercambio
        </Button>
      </div>
    )
  }

  // fixed | offer
  return (
    <div>
      <div className="mb-1 flex items-end gap-3">
        <div>
          <div className="font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
            Precio
          </div>
          <Price amount={L.price} size={32} />
        </div>
        {valDelta < 0 && (
          <span className="mb-1.5 font-wp text-[13px] font-bold text-wp-green">
            {Math.abs(valDelta)}% bajo valoración
          </span>
        )}
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <Button variant="primary" className="flex-1 py-[13px]" onClick={onBuy}>
          <Icon name="cart" size={17} />
          Comprar ahora
        </Button>
        <Button
          className="px-[15px] py-[13px]"
          aria-label="Añadir al carrito"
          onClick={() => {
            addToCart(L)
            toast("Añadido al carrito", "success")
          }}
        >
          <Icon name="cart" size={16} />
          <Icon name="plus" size={13} className="-ml-1" />
        </Button>
        {L.format === "offer" && (
          <Button className="px-4 py-[13px]" onClick={onOffer}>
            <Icon name="handshake" size={16} />
            Ofertar
          </Button>
        )}
      </div>

      {/* The escrow promise, stated plainly at the point of payment. It is not
          marketing — it is literally what `POST /orders` does with the money. */}
      <div className="mt-3 flex items-center gap-2 font-wp text-[12px] font-semibold text-wp-fg-muted">
        <Icon name="lock" size={14} className="text-wp-green" />
        Pago retenido en depósito hasta que confirmes la recepción.
      </div>
    </div>
  )
}
