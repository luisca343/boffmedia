"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { WpListing } from "../../_types/market.types"
import { fmt } from "../../_utils/format"
import { useCreateOffer } from "../../_hooks/queries"
import { Button, Icon, Modal, ModalHead, Price, Range } from "../ui"
import { MonRow, listingHero } from "./parts"

/**
 * Name your price.
 *
 * The verdict strip under the slider is the useful part: it scores the offer against
 * the *valuation*, not against the asking price, so a buyer can see that a seller is
 * asking well over the odds and that a "low" offer is actually fair. It is a
 * heuristic and says so — it does not predict what this particular seller will do.
 */
export function OfferModal({ listing: L, onClose }: { listing: WpListing; onClose: () => void }) {
  const floor = Math.round(L.price * 0.4)
  const [amount, setAmount] = useState(Math.round((L.price * 0.85) / 50) * 50)
  const createOffer = useCreateOffer()

  const pct = L.value > 0 ? Math.round((amount / L.value) * 100) : 100
  const verdict =
    pct < 70
      ? { label: "Probablemente rechazada", tone: "text-wp-rose" }
      : pct < 90
        ? { label: "Negociable", tone: "text-wp-amber" }
        : { label: "Muy probable", tone: "text-wp-green" }

  const mon = listingHero(L)

  return (
    <Modal onClose={onClose}>
      <ModalHead
        title="Hacer una oferta"
        sub={`Precio de venta ₽${fmt(L.price)} · valoración ₽${fmt(L.value)}`}
        onClose={onClose}
      />
      <div className="p-5">
        {mon && <MonRow mon={mon} />}

        <div className="mb-2 mt-5 text-center">
          <div className="font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
            Tu oferta
          </div>
          <Price amount={amount} size={34} />
        </div>

        <Range
          min={floor}
          max={L.price}
          step={50}
          value={amount}
          aria-label="Importe de la oferta"
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <div className="mt-1 flex justify-between font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
          <span className="wp-num">₽{fmt(floor)}</span>
          <span className={cn("font-bold", verdict.tone)}>
            {verdict.label} · {pct}% de la valoración
          </span>
          <span className="wp-num">₽{fmt(L.price)}</span>
        </div>

        <div className="mt-4 flex gap-2">
          {[0.7, 0.8, 0.9].map((f) => (
            <Button
              key={f}
              className="flex-1"
              onClick={() => setAmount(Math.round((L.price * f) / 50) * 50)}
            >
              {Math.round(f * 100)}%
            </Button>
          ))}
        </div>

        <Button
          variant="primary"
          className="mt-4 w-full py-[13px]"
          disabled={createOffer.isPending}
          onClick={() =>
            createOffer.mutate({ listingId: L.id, amount }, { onSuccess: onClose })
          }
        >
          <Icon name="handshake" size={16} />
          {createOffer.isPending ? "Enviando…" : `Enviar oferta de ₽${fmt(amount)}`}
        </Button>

        {/* Nothing is charged now. The seller has to accept, and accepting is what
            creates the order — at which point the escrow is taken. */}
        <p className="mt-3 text-center font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
          No se te cobra nada ahora. Si {L.seller.username} acepta, se creará el pedido y el pago
          quedará en depósito.
        </p>
      </div>
    </Modal>
  )
}
