"use client"

import { useState } from "react"
import type { WpListing } from "../../_types/market.types"
import { fmt } from "../../_utils/format"
import { useBalance, usePlaceBid } from "../../_hooks/queries"
import { Button, Icon, Modal, ModalHead, Price } from "../ui"
import { MonRow, listingHero } from "./parts"

/**
 * A bid.
 *
 * Note what this does NOT do: it does not take your money. A bid is a commitment,
 * not a payment — the escrow is only taken from the winner when the auction closes
 * (the cron in `WigglypopAuctionService`). So the balance check here is a *guard*
 * against bidding what you cannot pay, not a charge.
 */
export function BidModal({ listing: L, onClose }: { listing: WpListing; onClose: () => void }) {
  const current = L.currentBid ?? L.price
  const step = L.minIncrement ?? 50
  const min = current + step

  const [amount, setAmount] = useState(min)
  const { data: balanceRaw } = useBalance()
  const balance = balanceRaw ?? null
  const placeBid = usePlaceBid()

  const insufficient = balance !== null && amount > balance
  const mon = listingHero(L)

  return (
    <Modal onClose={onClose}>
      <ModalHead
        title="Pujar en subasta"
        sub={`Puja actual ₽${fmt(current)} · ${L.bids ?? 0} ${L.bids === 1 ? "puja" : "pujas"}`}
        onClose={onClose}
      />
      <div className="p-5">
        {mon && <MonRow mon={mon} />}

        <div className="my-5 text-center">
          <div className="font-wp text-[11px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
            Tu puja
          </div>
          <Price amount={amount} size={34} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            iconOnly
            aria-label="Bajar la puja"
            disabled={amount <= min}
            onClick={() => setAmount((a) => Math.max(min, a - step))}
          >
            <Icon name="minus" size={16} />
          </Button>
          <div className="wp-num flex-1 rounded-[10px] border border-wp-line/24 bg-wp-panel-2 py-2.5 text-center font-wp text-[15px] text-wp-fg">
            ₽{fmt(amount)}
          </div>
          <Button
            iconOnly
            aria-label="Subir la puja"
            onClick={() => setAmount((a) => a + step)}
          >
            <Icon name="plus" size={16} />
          </Button>
        </div>

        <div className="mt-2 text-center font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
          Incremento mínimo ₽{fmt(step)} · sólo se te cobra si ganas
        </div>

        <Button
          variant="primary"
          className="mt-4 w-full py-[13px]"
          disabled={insufficient || placeBid.isPending}
          onClick={() =>
            placeBid.mutate({ listingId: L.id, amount }, { onSuccess: onClose })
          }
        >
          <Icon name="gavel" size={16} />
          {insufficient
            ? "Saldo insuficiente"
            : placeBid.isPending
              ? "Pujando…"
              : `Confirmar puja ₽${fmt(amount)}`}
        </Button>
      </div>
    </Modal>
  )
}
