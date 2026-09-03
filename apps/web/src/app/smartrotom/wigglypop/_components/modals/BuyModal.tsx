"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { WpListing } from "../../_types/market.types"
import { fmt } from "../../_utils/format"
import { feeFor } from "../../_stores/cartStore"
import { useBalance, useCreateOrder } from "../../_hooks/queries"
import { Button, Icon, Modal, ModalDone, ModalHead, TrustBadges } from "../ui"
import { CostSummary, EscrowSteps, MonRow, WalletRow, listingHero } from "./parts"

/**
 * The single-listing purchase. Money moves for real here: `POST /orders` debits the
 * buyer's StarBank account into a market escrow account, and the Pokémon only
 * reaches the buyer once the hand-off is confirmed (or immediately, if the server is
 * running atomic custody — see `WigglypopCustodyService`).
 */
export function BuyModal({ listing: L, onClose }: { listing: WpListing; onClose: () => void }) {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const [done, setDone] = useState<{ code: string; atomic: boolean } | null>(null)

  const { data: balanceRaw } = useBalance()
  const balance = balanceRaw ?? null
  const createOrder = useCreateOrder()

  // An auction's buy-now price wins over the listing price when it is set.
  const amount = L.format === "auction" && L.buyNow ? L.buyNow : L.price
  const fee = feeFor(amount)
  const total = amount + fee
  const insufficient = balance !== null && total > balance

  const mon = listingHero(L)

  if (done) {
    return (
      <Modal onClose={onClose}>
        <ModalDone
          title={t("modal.buy.doneTitle")}
          actions={
            <>
              <Button onClick={onClose}>{t("common.keepShopping")}</Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  router.push("/smartrotom/wigglypop/compras")
                }}
              >
                {t("common.viewOrders")}
              </Button>
            </>
          }
        >
          {t("common.orderCodePrefix")} <b className="text-wp-fg">{done.code}</b> · ₽{fmt(total)}{" "}
          {done.atomic ? t("modal.buy.paid") : t("common.heldInEscrow")}.{" "}
          {done.atomic
            ? t("modal.buy.atomicDelivered")
            : t("modal.buy.manualDelivery", { seller: L.seller.username })}
          <EscrowSteps atomic={done.atomic} />
        </ModalDone>
      </Modal>
    )
  }

  return (
    <Modal onClose={onClose}>
      <ModalHead
        title={t("modal.buy.title")}
        sub={t("modal.buy.sub")}
        onClose={onClose}
      />
      <div className="p-5">
        {mon && <MonRow mon={mon} />}

        <CostSummary subtotal={amount} fee={fee} total={total} subtotalLabel={t("modal.buy.itemPriceLabel")} />
        <WalletRow balance={balance} insufficient={insufficient} />

        <div className="mt-3.5">
          <TrustBadges listing={L} />
        </div>

        <Button
          variant="primary"
          className="mt-4 w-full py-[0.8125rem]"
          disabled={insufficient || createOrder.isPending}
          onClick={() =>
            createOrder.mutate([{ listingId: L.id, qty: 1 }], {
              onSuccess: (raw: any) =>
                setDone({
                  code: raw?.code ?? "—",
                  // The server tells us which custody path settled it. We never
                  // assume: under atomic custody the order comes back already
                  // `completado`, and the copy has to match what actually happened.
                  atomic: raw?.status === "completado",
                }),
            })
          }
        >
          <Icon name="lock" size={16} />
          {insufficient
            ? t("common.insufficientBalance")
            : createOrder.isPending
              ? t("common.processing")
              : t("modal.buy.payButton", { total: fmt(total) })}
        </Button>
      </div>
    </Modal>
  )
}
