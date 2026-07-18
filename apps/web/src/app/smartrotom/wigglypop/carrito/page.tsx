"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { fmt } from "../_utils/format"
import { cartCount, feeFor, lineTotal, useCartStore } from "../_stores/cartStore"
import { useBalance, useCreateOrder } from "../_hooks/queries"
import { EscrowSteps, WalletRow } from "../_components/modals/parts"
import {
  Button,
  EmptyState,
  Icon,
  Modal,
  ModalDone,
  ModalHead,
  Panel,
  Price,
  Sprite,
  SpriteStage,
} from "../_components/ui"

/**
 * The cart, and the one checkout that pays for several sellers at once.
 *
 * The whole basket becomes ONE order and ONE escrow hold — which is the point of
 * having a cart at all here. Each line still settles with its own seller
 * independently (a line you have confirmed releases that seller's money; a line you
 * are still waiting on does not), so a slow seller cannot hold the rest hostage.
 */
export default function CartPage() {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const lines = useCartStore((s) => s.lines)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)

  const { data: balanceRaw } = useBalance()
  const balance = balanceRaw ?? null
  const createOrder = useCreateOrder()

  const [checkingOut, setCheckingOut] = useState(false)
  const [done, setDone] = useState<{ code: string; atomic: boolean } | null>(null)

  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0)
  const fee = feeFor(subtotal)
  const total = subtotal + fee
  const insufficient = balance !== null && total > balance
  const count = cartCount(lines)
  const sellers = new Set(lines.map((l) => l.listing.seller.uuid)).size

  function pay() {
    createOrder.mutate(
      lines.map((l) => ({ listingId: l.listing.id, qty: l.qty })),
      {
        onSuccess: (raw: any) => {
          clear()
          setCheckingOut(false)
          setDone({ code: raw?.code ?? "—", atomic: raw?.status === "completado" })
        },
      },
    )
  }

  if (done) {
    return (
      <Modal onClose={() => router.push("/smartrotom/wigglypop")}>
        <ModalDone
          title={t("carrito.orderDoneTitle")}
          actions={
            <>
              <Button onClick={() => router.push("/smartrotom/wigglypop")}>{t("common.keepShopping")}</Button>
              <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/compras")}>
                {t("common.viewOrders")}
              </Button>
            </>
          }
        >
          {t("common.orderCodePrefix")} <b className="text-wp-fg">{done.code}</b> · ₽{fmt(total)}{" "}
          {done.atomic ? t("modal.buy.paid") : t("common.heldInEscrow")}.
          <EscrowSteps atomic={done.atomic} />
        </ModalDone>
      </Modal>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <Head count={0} sellers={0} onClear={clear} />
        <EmptyState
          icon="cart"
          title={t("carrito.emptyTitle")}
          body={t("carrito.emptyBody")}
        >
          <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop")}>
            {t("common.exploreMarket")}
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Head count={count} sellers={sellers} onClear={clear} />

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] pb-10 pt-5">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,1fr)]">
          <div className="grid gap-2.5">
            {lines.map((l) => {
              const mon = l.listing.mons[0]
              const item = l.listing.items[0]
              return (
                <Panel key={l.key} className="flex items-center gap-3.5 p-3">
                  {mon ? (
                    <SpriteStage
                      mon={mon}
                      dots={false}
                      className="h-[54px] w-[54px] flex-none rounded-[11px]"
                    >
                      <Sprite mon={mon} className="relative z-[2] h-[78%] w-[78%]" />
                    </SpriteStage>
                  ) : (
                    <span className="flex h-[54px] w-[54px] flex-none items-center justify-center rounded-[11px] border border-wp-line/24 bg-wp-panel-2">
                      <Icon name="package" size={22} className="text-wp-fg-subtle" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-wp text-[14.5px] font-bold text-wp-fg">
                      {mon?.shiny && <span className="text-wp-teal">✦ </span>}
                      {l.listing.title}
                    </div>
                    <div className="mt-1 font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                      {l.listing.seller.username}
                      {item && ` · ${t("carrito.unitPriceAbbrev", { price: fmt(item.unitPrice) })}`}
                    </div>
                  </div>

                  {l.listing.kind === "item" && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        iconOnly
                        aria-label={t("common.decrease")}
                        disabled={l.qty <= 1}
                        onClick={() => setQty(l.key, l.qty - 1)}
                      >
                        <Icon name="minus" size={15} />
                      </Button>
                      <span className="wp-num min-w-[26px] text-center font-wp text-sm text-wp-fg">
                        {l.qty}
                      </span>
                      <Button iconOnly aria-label={t("common.increase")} onClick={() => setQty(l.key, l.qty + 1)}>
                        <Icon name="plus" size={15} />
                      </Button>
                    </div>
                  )}

                  <div className="min-w-[96px] text-right">
                    <Price amount={lineTotal(l)} size={17} />
                  </div>

                  <Button
                    variant="ghost"
                    iconOnly
                    aria-label={t("carrito.removeAria")}
                    onClick={() => remove(l.key)}
                  >
                    <Icon name="x" size={16} />
                  </Button>
                </Panel>
              )
            })}
          </div>

          <Panel className="sticky top-2 rounded-wp-lg p-5">
            <h3 className="mb-3.5 font-wp-display text-base font-semibold text-wp-fg">
              {t("carrito.summaryTitle")}
            </h3>
            <div className="grid gap-2.5">
              <Row k={t("carrito.subtotalLabel", { count })} v={subtotal} />
              <Row k={t("common.protectionFee")} v={fee} />
              <div className="my-1 h-px bg-wp-line/24" />
              <div className="flex items-baseline justify-between">
                <span className="font-wp text-base font-extrabold text-wp-fg">{t("common.total")}</span>
                <Price amount={total} size={22} />
              </div>
            </div>

            <div className="mt-4">
              <WalletRow balance={balance} insufficient={insufficient} />
            </div>

            <Button
              variant="primary"
              className="mt-3.5 w-full py-[13px]"
              disabled={insufficient}
              onClick={() => setCheckingOut(true)}
            >
              <Icon name="lock" size={16} />
              {insufficient ? t("common.insufficientBalance") : t("carrito.checkoutButton", { total: fmt(total) })}
            </Button>

            <p className="mt-3 flex items-start gap-2 font-wp text-[11.5px] font-semibold leading-relaxed text-wp-fg-muted">
              <Icon name="shieldCheck" size={15} className="mt-px flex-none text-wp-green" />
              {t("carrito.escrowExplain")}
            </p>
          </Panel>
        </div>
      </div>

      {checkingOut && (
        <Modal onClose={() => setCheckingOut(false)}>
          <ModalHead
            title={t("carrito.checkoutTitle")}
            sub={t("carrito.checkoutSub", { count, sellers })}
            onClose={() => setCheckingOut(false)}
          />
          <div className="p-5">
            <div className="wp-noscroll grid max-h-[240px] gap-2 overflow-y-auto">
              {lines.map((l) => (
                <div
                  key={l.key}
                  className="flex items-center gap-2.5 rounded-[11px] border border-wp-line/24 bg-wp-panel-2 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-wp text-[13.5px] font-bold text-wp-fg">
                      {l.listing.title}
                      {l.listing.kind === "item" && l.qty > 1 && (
                        <span className="font-semibold text-wp-fg-subtle"> ×{l.qty}</span>
                      )}
                    </div>
                    <div className="font-wp text-[11px] font-semibold text-wp-fg-subtle">
                      {l.listing.seller.username}
                    </div>
                  </div>
                  <span className="wp-num font-wp text-[13.5px] text-wp-fg">
                    ₽{fmt(lineTotal(l))}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-4 grid gap-2.5">
              <Row k={t("modal.parts.subtotalDefault")} v={subtotal} />
              <Row k={t("common.protectionFee")} v={fee} />
              <div className="my-0.5 h-px bg-wp-line/24" />
              <div className="flex items-baseline justify-between">
                <span className="font-wp text-[15px] font-bold text-wp-fg">{t("common.total")}</span>
                <Price amount={total} size={20} />
              </div>
            </div>

            <WalletRow balance={balance} insufficient={insufficient} />

            <Button
              variant="primary"
              className="mt-4 w-full py-[13px]"
              disabled={insufficient || createOrder.isPending}
              onClick={pay}
            >
              <Icon name="lock" size={16} />
              {createOrder.isPending ? t("common.processing") : t("carrito.payButton", { total: fmt(total) })}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Head({
  count,
  sellers,
  onClear,
}: {
  count: number
  sellers: number
  onClear: () => void
}) {
  const t = useTranslations("wigglypop")
  return (
    <div className="flex flex-none items-center gap-3 border-b border-wp-line/24 px-[30px] py-[18px]">
      <div className="flex-1">
        <h1 className="flex items-center gap-2.5 font-wp-display text-[21px] font-semibold text-wp-fg">
          <Icon name="cart" size={20} className="text-wp-accent" />
          {t("carrito.headTitle")}
        </h1>
        <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
          {count === 0 ? t("carrito.emptyLabel") : t("carrito.headSubtitle", { count, sellers })}
        </p>
      </div>
      {count > 0 && (
        <Button variant="ghost" onClick={onClear}>
          <Icon name="trash" size={15} />
          {t("carrito.clearButton")}
        </Button>
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between font-wp text-[13.5px]">
      <span className={cn("font-semibold text-wp-fg-muted")}>{k}</span>
      <span className="wp-num font-semibold text-wp-fg">₽{fmt(v)}</span>
    </div>
  )
}
