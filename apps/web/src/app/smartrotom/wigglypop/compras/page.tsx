"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import type { WpOrder } from "../_types/market.types"
import { ESCROW_STEP_KEYS, ORDER_STATUS_STYLE, escrowStep, fmt, timeAgo } from "../_utils/format"
import { useConfirmOrder, useOrders } from "../_hooks/queries"
import {
  Button,
  EmptyState,
  Icon,
  Panel,
  Price,
  Skeleton,
  Sprite,
  SpriteStage,
  Stepper,
  Tabs,
} from "../_components/ui"

const TABS = [
  { key: "todas", labelKey: "compras.tabAll" },
  { key: "activas", labelKey: "compras.tabActive" },
  { key: "completadas", labelKey: "compras.tabCompleted" },
] as const

type Tab = (typeof TABS)[number]["key"]

/**
 * Mis compras — and, in practice, the escrow console.
 *
 * "Confirmar recepción" on a card here is not a UI acknowledgement: it is the call
 * that releases the held money to the seller (`POST /orders/:id/confirm`). It is the
 * single most consequential button in the app, which is why it is the only primary
 * action on the page and why it only appears once the seller has actually said they
 * handed the Pokémon over.
 */
export default function OrdersPage() {
  const t = useTranslations("wigglypop")
  const [tab, setTab] = useState<Tab>("todas")
  const { data: orders, isLoading, error } = useOrders()

  const all = orders ?? []
  const filtered = all.filter((o) => {
    if (tab === "activas") return o.status === "escrow" || o.status === "transferido"
    if (tab === "completadas") return o.status === "completado"
    return true
  })

  const spent = all
    .filter((o) => o.status !== "cancelado" && o.status !== "reembolsado")
    .reduce((s, o) => s + o.total, 0)

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-none flex-wrap items-center gap-4 border-b border-wp-line/24 px-[30px] py-[18px]">
        <div className="min-w-[240px] flex-1">
          <h1 className="flex items-center gap-2.5 whitespace-nowrap font-wp-display text-[21px] font-semibold text-wp-fg">
            <Icon name="history" size={20} className="text-wp-accent" />
            {t("compras.title")}
          </h1>
          <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
            <span className="wp-num">{all.length}</span> {t("compras.subtitleOrders")} ·{" "}
            <span className="wp-num">₽{fmt(spent)}</span> {t("compras.subtitleSpent")}
          </p>
        </div>
        <Tabs tabs={TABS.map((tb) => ({ ...tb, label: t(tb.labelKey) }))} value={tab} onChange={setTab} />
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] pb-10 pt-5">
        {error ? (
          <EmptyState icon="alert" title={t("compras.errorTitle")} body={userMessageFrom(error, t("common.retryFallback"))} />
        ) : isLoading ? (
          <div className="grid max-w-[880px] gap-3.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-wp-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="history"
            title={t("compras.emptyTitle")}
            body={t("compras.emptyBody")}
          />
        ) : (
          <div className="grid max-w-[880px] gap-3.5">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order: o }: { order: WpOrder }) {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const confirm = useConfirmOrder()
  const st = ORDER_STATUS_STYLE[o.status]
  const step = escrowStep(o.status)
  const refunded = step === -1

  return (
    <Panel className="rounded-wp-lg p-[18px]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-wp-display text-[15px] font-semibold text-wp-fg">{o.code}</span>
        <span
          className={cn(
            "rounded-wp-pill px-2.5 py-1 font-wp text-[11px] font-extrabold",
            st.text,
            st.bg,
          )}
        >
          {t(st.key)}
        </span>
        <span className="font-wp text-[12px] font-semibold text-wp-fg-subtle">
          {timeAgo(o.createdAt)}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
            {t("compras.linesCount", { count: o.lines.length })} ·
          </span>
          <Price amount={o.total} size={17} />
        </div>
      </div>

      <div className="my-3.5 grid gap-2">
        {o.lines.map((l) => {
          const mon = l.mons[0]
          return (
            <div
              key={l.id}
              className="flex cursor-pointer items-center gap-2.5"
              onClick={() => router.push(`/smartrotom/wigglypop/anuncio/${l.listingId}`)}
            >
              {mon ? (
                <SpriteStage
                  mon={mon}
                  dots={false}
                  className="h-11 w-11 flex-none rounded-[11px]"
                >
                  <Sprite mon={mon} className="relative z-[2] h-[78%] w-[78%]" />
                </SpriteStage>
              ) : (
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[11px] border border-wp-line/24 bg-wp-panel-2">
                  <Icon name="package" size={18} className="text-wp-fg-subtle" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-wp text-[13.5px] font-bold text-wp-fg">
                  {mon?.shiny && <span className="text-wp-teal">✦ </span>}
                  {l.title}
                  {l.kind === "item" && l.qty > 1 && (
                    <span className="font-semibold text-wp-fg-subtle"> ×{l.qty}</span>
                  )}
                  {mon && (
                    <span className="wp-num font-semibold text-wp-fg-subtle"> · {t("common.levelDot", { level: mon.level })}</span>
                  )}
                </div>
                <div className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                  {l.seller.username}
                </div>
              </div>
              <span className="wp-num font-wp text-[13.5px] text-wp-fg">₽{fmt(l.lineTotal)}</span>
            </div>
          )
        })}
      </div>

      {refunded ? (
        <div className="flex items-center gap-2 rounded-xl border border-wp-rose/25 bg-wp-rose/[.08] px-3.5 py-3 font-wp text-[12.5px] font-semibold text-wp-fg-muted">
          <Icon name="arrowL" size={15} className="text-wp-rose" />
          {t("compras.refundedNote")}
        </div>
      ) : (
        <div className="flex items-center gap-3.5 rounded-xl border border-wp-line/24 bg-wp-panel-2 px-3.5 py-3">
          <Stepper steps={ESCROW_STEP_KEYS.map((k) => t(k))} current={step} className="flex-1" />
          <div className="flex-none">
            {o.status === "escrow" && (
              <span className="flex items-center gap-1.5 font-wp text-[12px] font-semibold text-wp-fg-subtle">
                <Icon name="clock" size={14} />
                {t("compras.waitingSeller")}
              </span>
            )}
            {o.status === "transferido" && (
              <Button
                variant="primary"
                className="px-3.5 py-2.5 text-[12.5px]"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate(o.id)}
              >
                <Icon name="check" size={15} />
                {confirm.isPending ? t("compras.releasing") : t("compras.confirmButton")}
              </Button>
            )}
            {o.status === "completado" && (
              <span className="flex items-center gap-1.5 font-wp text-[12px] font-bold text-wp-green">
                <Icon name="shieldCheck" size={15} />
                {t("compras.paymentReleased")}
              </span>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}
