"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { WigglypopService } from "@/services/api/smartrotom/wigglypopService"
import { useQueryClient } from "@tanstack/react-query"
import type { WpListing, WpListingStatus } from "../_types/market.types"
import { FORMAT_ICON, FORMAT_LABEL_KEY, LISTING_STATUS_STYLE, fmt, timeAgo } from "../_utils/format"
import {
  useListings,
  useMarkTransferred,
  useOrders,
  useSellerOffers,
  useUpdateListing,
  useWpUuid,
} from "../_hooks/queries"
import { EditPriceModal } from "../_components/EditPriceModal"
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  Panel,
  Price,
  Skeleton,
  Sprite,
  SpriteStage,
  Table,
  Tabs,
  TD,
  TH,
  TR,
  toast,
} from "../_components/ui"

const TABS = [
  { key: "activo", labelKey: "anuncios.tabActive" },
  { key: "pausado", labelKey: "anuncios.tabPaused" },
  { key: "vendido", labelKey: "anuncios.tabSold" },
  { key: "todos", labelKey: "anuncios.tabAll" },
] as const

type Tab = (typeof TABS)[number]["key"]

/**
 * Mis anuncios — the seller's side of the marketplace.
 *
 * Three jobs live here, in priority order: answer your offers, hand over what you
 * have sold, and manage your listings. The two ACTION panels sit above the table on
 * purpose — an unanswered offer and an unshipped sale are both things another player
 * is waiting on, and burying them under a table of inventory is how a marketplace
 * gets a reputation for slow sellers.
 */
export default function SellerDashboardPage() {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const uuid = useWpUuid()
  const [tab, setTab] = useState<Tab>("activo")
  const [editing, setEditing] = useState<WpListing | null>(null)

  // 100 is the server's hard cap (`limit must not be greater than 100`); asking for
  // more is a 400, not a clamp.
  const { data, isLoading } = useListings({ limit: 100 })
  const { data: offers } = useSellerOffers()
  const { data: orders } = useOrders()
  const update = useUpdateListing()

  const mine = (data?.items ?? []).filter((L) => L.seller.uuid === uuid)
  const shown = mine.filter((L) => tab === "todos" || L.status === tab)

  const sold = mine.filter((L) => L.status === "vendido")
  const active = mine.filter((L) => L.status === "activo")
  const income = sold.reduce((s, L) => s + L.price, 0)
  const onSale = active.reduce(
    (s, L) => s + (L.format === "auction" ? (L.currentBid ?? L.price) : L.price),
    0,
  )
  const watchers = active.reduce((s, L) => s + L.watchers, 0)

  const counts: Record<Tab, number> = {
    activo: active.length,
    pausado: mine.filter((L) => L.status === "pausado").length,
    vendido: sold.length,
    todos: mine.length,
  }

  const pendingOffers = (offers ?? []).filter((o) => o.status === "pendiente")
  // Orders where *I* am the seller and the buyer is still waiting on me.
  const toDeliver = (orders ?? []).flatMap((o) =>
    o.lines
      .filter((l) => l.seller.uuid === uuid && l.deliveryStatus === "pendiente")
      .map((l) => ({ order: o, line: l })),
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-none flex-wrap items-center gap-3.5 border-b border-wp-line/24 px-[30px] py-[18px]">
        <div className="min-w-[220px] flex-1">
          <h1 className="flex items-center gap-2.5 whitespace-nowrap font-wp-display text-[21px] font-semibold text-wp-fg">
            <Icon name="list" size={20} className="text-wp-accent" />
            {t("anuncios.title")}
          </h1>
          <p className="mt-0.5 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
            {t("anuncios.subtitle")}
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/vender")}>
          <Icon name="plus" size={16} />
          {t("common.publishListingButton")}
        </Button>
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto px-[30px] pb-10 pt-5">
        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat k={t("anuncios.statIncome")} v={`₽${fmt(income)}`} icon="dollar" tone="text-wp-green" />
          <Stat k={t("anuncios.statSales")} v={fmt(sold.length)} icon="cart" />
          <Stat k={t("anuncios.statOnSale")} v={`₽${fmt(onSale)}`} icon="tag" tone="text-wp-accent" />
          <Stat k={t("anuncios.statWatchers")} v={fmt(watchers)} icon="bookmark" tone="text-wp-gold" />
        </div>

        {/* Things other players are waiting on */}
        {toDeliver.length > 0 && (
          <ActionPanel
            icon="package"
            tone="gold"
            title={t("anuncios.pendingDeliveries", { count: toDeliver.length })}
            body={t("anuncios.pendingDeliveriesBody")}
          >
            {toDeliver.map(({ order, line }) => (
              <DeliverRow key={line.id} orderId={order.id} title={line.title} buyerPaid={line.lineTotal} />
            ))}
          </ActionPanel>
        )}

        {pendingOffers.length > 0 && (
          <ActionPanel
            icon="handshake"
            tone="violet"
            title={t("anuncios.pendingOffers", { count: pendingOffers.length })}
            body={t("anuncios.pendingOffersBody")}
          >
            {pendingOffers.map((o) => (
              <OfferRow
                key={o.id}
                id={o.id}
                who={o.buyerName}
                what={o.listingTitle}
                amount={o.amount}
              />
            ))}
          </ActionPanel>
        )}

        <Tabs
          tabs={TABS.map((tb) => ({ ...tb, label: t(tb.labelKey), count: counts[tb.key] }))}
          value={tab}
          onChange={setTab}
          className="mb-3.5 w-fit"
        />

        {isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-wp-sm" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState icon="list" title={t("anuncios.emptyTitle")} body={t("anuncios.emptyBody")}>
            <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/vender")}>
              <Icon name="plus" size={15} />
              {t("common.publishListingButton")}
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t("anuncios.colListing")}</TH>
                <TH>{t("anuncios.colFormat")}</TH>
                <TH>{t("anuncios.colStatus")}</TH>
                <TH className="text-right">{t("anuncios.colViews")}</TH>
                <TH className="text-right">{t("anuncios.colWatchers")}</TH>
                <TH className="text-right">{t("anuncios.colPrice")}</TH>
                <TH className="text-right">{t("anuncios.colActions")}</TH>
              </tr>
            </thead>
            <tbody>
              {shown.map((L) => {
                const st = LISTING_STATUS_STYLE[L.status]
                const mon = L.mons[0]
                const price = L.format === "auction" ? (L.currentBid ?? L.price) : L.price
                return (
                  <TR key={L.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        {mon ? (
                          <SpriteStage
                            mon={mon}
                            dots={false}
                            className="h-10 w-10 flex-none rounded-[9px]"
                          >
                            <Sprite mon={mon} className="relative z-[2] h-[78%] w-[78%]" />
                          </SpriteStage>
                        ) : (
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[9px] border border-wp-line/24 bg-wp-panel-2">
                            <Icon name="package" size={16} className="text-wp-fg-subtle" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-bold text-wp-fg">
                            {mon?.shiny && <span className="text-wp-teal">✦ </span>}
                            {L.title}
                          </div>
                          <div className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                            {mon ? (
                              <span className="wp-num">
                                {t("common.levelIvPercent", { level: mon.level, pct: mon.ivPct })}
                              </span>
                            ) : (
                              L.items[0]?.category
                            )}{" "}
                            · {timeAgo(L.createdAt)}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Chip className="text-[11px]">
                        <Icon name={FORMAT_ICON[L.format]} size={12} />
                        {t(FORMAT_LABEL_KEY[L.format])}
                      </Chip>
                    </TD>
                    <TD>
                      <span
                        className={cn(
                          "rounded-wp-pill px-2.5 py-1 font-wp text-[11px] font-extrabold",
                          st.text,
                          st.bg,
                        )}
                      >
                        {t(st.key)}
                      </span>
                    </TD>
                    <TD className="wp-num text-right text-wp-fg-muted">{fmt(L.views)}</TD>
                    <TD className="wp-num text-right text-wp-fg-muted">
                      {L.status === "vendido" ? "—" : fmt(L.watchers)}
                    </TD>
                    <TD className="text-right">
                      <Price amount={price} size={15} />
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-1">
                        {L.status !== "vendido" && (
                          <Button
                            variant="ghost"
                            iconOnly
                            aria-label={t("anuncios.editPriceAria")}
                            onClick={() => setEditing(L)}
                          >
                            <Icon name="tag" size={15} />
                          </Button>
                        )}
                        {L.status === "activo" && (
                          <Button
                            variant="ghost"
                            iconOnly
                            aria-label={t("anuncios.pauseAria")}
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate(
                                { id: L.id, patch: { status: "pausado" as WpListingStatus } },
                                { onSuccess: () => toast(t("toast.listingPaused"), "info") },
                              )
                            }
                          >
                            <Icon name="mute" size={15} />
                          </Button>
                        )}
                        {L.status === "pausado" && (
                          <Button
                            variant="ghost"
                            iconOnly
                            aria-label={t("anuncios.resumeAria")}
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate(
                                { id: L.id, patch: { status: "activo" as WpListingStatus } },
                                { onSuccess: () => toast(t("toast.listingResumed"), "success") },
                              )
                            }
                          >
                            <Icon name="refresh" size={15} />
                          </Button>
                        )}
                        {L.status === "vendido" && (
                          <span className="inline-flex items-center gap-1 font-wp text-[11.5px] font-bold text-wp-green">
                            <Icon name="shieldCheck" size={14} />
                            {t("anuncios.settledLabel")}
                          </span>
                        )}
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      {editing && <EditPriceModal listing={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function Stat({
  k,
  v,
  icon,
  tone,
}: {
  k: string
  v: string
  icon: "dollar" | "cart" | "tag" | "bookmark"
  tone?: string
}) {
  return (
    <Panel className="px-4 py-3.5">
      <div className="flex items-center gap-[7px] font-wp text-[11px] font-extrabold uppercase tracking-[.05em] text-wp-fg-subtle">
        <Icon name={icon} size={14} className={tone} />
        {k}
      </div>
      <div className={cn("wp-num mt-1 font-wp-display text-[23px] font-semibold", tone ?? "text-wp-fg")}>
        {v}
      </div>
    </Panel>
  )
}

function ActionPanel({
  icon,
  tone,
  title,
  body,
  children,
}: {
  icon: "package" | "handshake"
  tone: "gold" | "violet"
  title: string
  body: string
  children: React.ReactNode
}) {
  const TONE = {
    gold: "border-wp-gold/30 bg-wp-gold/[.08]",
    violet: "border-wp-violet/30 bg-wp-violet/[.07]",
  } as const
  const ICON = { gold: "text-wp-gold", violet: "text-wp-violet" } as const

  return (
    <div className={cn("mb-5 rounded-wp border-wp p-4", TONE[tone])}>
      <div className="flex items-center gap-2">
        <Icon name={icon} size={17} className={ICON[tone]} />
        <span className="font-wp text-sm font-bold text-wp-fg">{title}</span>
      </div>
      <p className="mt-1 font-wp text-[12px] font-semibold text-wp-fg-muted">{body}</p>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  )
}

function DeliverRow({
  orderId,
  title,
  buyerPaid,
}: {
  orderId: number
  title: string
  buyerPaid: number
}) {
  const t = useTranslations("wigglypop")
  const mark = useMarkTransferred()
  return (
    <div className="flex items-center gap-3 rounded-xl border border-wp-line/24 bg-white px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate font-wp text-[13.5px] font-bold text-wp-fg">{title}</div>
        <div className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
          {t("anuncios.buyerPaid", { amount: fmt(buyerPaid) })}
        </div>
      </div>
      <Button
        variant="primary"
        className="px-3.5 py-2 text-[12.5px]"
        disabled={mark.isPending}
        onClick={() => mark.mutate(orderId)}
      >
        <Icon name="check" size={14} />
        {t("anuncios.markDeliveredButton")}
      </Button>
    </div>
  )
}

function OfferRow({
  id,
  who,
  what,
  amount,
}: {
  id: number
  who: string
  what: string
  amount: number
}) {
  const t = useTranslations("wigglypop")
  const qc = useQueryClient()
  const uuid = useWpUuid()
  const [busy, setBusy] = useState(false)

  async function respond(accept: boolean) {
    if (!uuid) return
    setBusy(true)
    const res = accept
      ? await WigglypopService.acceptOffer(id, uuid)
      : await WigglypopService.rejectOffer(id, uuid)
    setBusy(false)
    if (!res.success) {
      toast(res.userMessage ?? t("toast.offerRespondError"), "error")
      return
    }
    toast(accept ? t("toast.offerAccepted") : t("toast.offerRejected"), "success")
    void qc.invalidateQueries({ queryKey: ["wigglypop"] })
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-wp-line/24 bg-white px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate font-wp text-[13.5px] font-bold text-wp-fg">{what}</div>
        <div className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
          {t("anuncios.buyerOffers", { buyer: who, amount: fmt(amount) })}
        </div>
      </div>
      <Button variant="danger" className="px-3 py-2 text-[12.5px]" disabled={busy} onClick={() => respond(false)}>
        {t("common.reject")}
      </Button>
      <Button
        variant="primary"
        className="px-3.5 py-2 text-[12.5px]"
        disabled={busy}
        onClick={() => respond(true)}
      >
        <Icon name="check" size={14} />
        {t("common.accept")}
      </Button>
    </div>
  )
}
