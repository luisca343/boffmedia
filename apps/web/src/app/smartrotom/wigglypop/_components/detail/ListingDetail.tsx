"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpListing } from "../../_types/market.types"
import { FORMAT_LABEL_KEY, fmt } from "../../_utils/format"
import { RARITY_STRIP } from "../../_utils/rarity"
import {
  useListing,
  usePriceHistory,
  useToggleWatch,
  useWatchlist,
} from "../../_hooks/queries"
import { BuyModal } from "../modals/BuyModal"
import { BidModal } from "../modals/BidModal"
import { OfferModal } from "../modals/OfferModal"
import { TradeModal } from "../modals/TradeModal"
import {
  Avatar,
  Button,
  Chip,
  CornerBadge,
  EmptyState,
  Icon,
  Panel,
  Price,
  PriceChart,
  RarityBadge,
  Skeleton,
  Sprite,
  SpriteStage,
  Stars,
  TrustBadges,
  ValueBox,
} from "../ui"
import { GenderIcon, MonSpecs, TypeRow } from "./MonSpecs"
import { PurchasePanel } from "./PurchasePanel"

type Sheet = null | "buy" | "bid" | "offer" | "trade"

export function ListingDetail({ id }: { id: number }) {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const [sheet, setSheet] = useState<Sheet>(null)

  const { data: L, isLoading, error } = useListing(id)
  const { data: watched } = useWatchlist()
  const toggleWatch = useToggleWatch()

  const mon = L?.mons[0]
  const { data: history } = usePriceHistory(mon?.dex ?? null)

  const isWatched = useMemo(
    () => (watched ?? []).some((w) => w.id === id),
    [watched, id],
  )

  if (isLoading) return <DetailSkeleton />
  if (error || !L) {
    return (
      <EmptyState icon="alert" title={t("detail.notFoundTitle")}>
        <Button onClick={() => router.push("/smartrotom/wigglypop")}>{t("detail.backToMarket")}</Button>
      </EmptyState>
    )
  }
  if (!mon) {
    return <EmptyState icon="package" title={t("detail.noMonTitle")} />
  }

  const valDelta = L.value > 0 ? Math.round(((L.price - L.value) / L.value) * 100) : 0

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-none items-center gap-3 px-[26px] pt-3">
        <Button variant="ghost" onClick={() => router.back()}>
          <Icon name="arrowL" size={16} />
          {t("common.back")}
        </Button>
        <span className="font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
          {t("detail.breadcrumbMarket")} / {t(FORMAT_LABEL_KEY[L.format])} / <span className="text-wp-fg-muted">{mon.name}</span>
        </span>
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
          {/* ── hero ─────────────────────────────────────────────────────── */}
          <SpriteStage
            mon={mon}
            className="relative min-h-[320px] flex-col border-b border-wp-line/24 p-8 lg:border-b-0 lg:border-r"
          >
            <div className={cn("absolute inset-x-0 top-0 z-[3] h-1", RARITY_STRIP[L.rarity])} />

            <div className="absolute left-[18px] top-4 z-[3] flex flex-col gap-2">
              {mon.shiny && (
                <CornerBadge tone="shiny" className="text-[12px]">
                  <Icon name="sparkles" size={13} />
                  {t("common.shinyBadge")}
                </CornerBadge>
              )}
              {mon.legendary && (
                <CornerBadge tone="legend" className="text-[12px]">
                  <Icon name="crown" size={13} filled />
                  {t("common.legendaryBadge")}
                </CornerBadge>
              )}
              <CornerBadge tone="neutral" className="bg-white/85">
                <RarityBadge rarity={L.rarity} />
              </CornerBadge>
            </div>

            <button
              type="button"
              onClick={() => toggleWatch.mutate(L.id)}
              aria-label={isWatched ? t("common.unwatch") : t("common.watch")}
              aria-pressed={isWatched}
              className={cn(
                "absolute right-[18px] top-4 z-[3] flex h-10 w-10 items-center justify-center rounded-wp-pill border-wp",
                "transition-all duration-150 ease-wp hover:scale-110 motion-reduce:transform-none",
                isWatched
                  ? "border-wp-accent bg-wp-accent text-white"
                  : "border-wp-line/24 bg-white/90 text-wp-fg-subtle hover:border-wp-accent hover:text-wp-accent",
              )}
            >
              <Icon name="bookmark" size={18} filled={isWatched} />
            </button>

            <Sprite
              mon={mon}
              hero
              className="relative z-[2] w-[min(320px,70%)] animate-wp-floaty motion-reduce:animate-none"
            />

            <div className="absolute bottom-5 z-[3] flex gap-2">
              <Chip className="bg-white/85">#{String(mon.dex).padStart(3, "0")}</Chip>
              <Chip className="bg-white/85">
                <span className="wp-num">{fmt(L.views)}</span> {t("common.viewsSuffix")}
              </Chip>
            </div>
          </SpriteStage>

          {/* ── specs ────────────────────────────────────────────────────── */}
          <div className="wp-noscroll overflow-y-auto bg-white/40 px-[30px] pb-10 pt-[26px]">
            <h1 className="flex items-center gap-2.5 font-wp-display text-[28px] font-semibold text-wp-fg">
              {mon.shiny && <span className="text-wp-teal">✦</span>}
              {mon.name}
              <GenderIcon gender={mon.gender} />
            </h1>
            <TypeRow mon={mon} />
            <MonSpecs mon={mon} />
          </div>
        </div>

        {/* ── purchase + valuation + history + seller ───────────────────── */}
        <div className="grid gap-[18px] px-[26px] pb-9 pt-1.5 lg:grid-cols-[1.3fr_1fr]">
          <Panel className="border-wp border-wp-line/46 bg-white p-[18px] shadow-wp">
            <PurchasePanel
              listing={L}
              onBuy={() => setSheet("buy")}
              onOffer={() => setSheet("offer")}
              onBid={() => setSheet("bid")}
              onTrade={() => setSheet("trade")}
            />
          </Panel>

          <div className="flex flex-col gap-4">
            <ValueBox>
              <div className="mb-2 flex items-center gap-2">
                <Icon name="wand" size={16} className="text-wp-teal" />
                <span className="font-wp text-[13px] font-bold text-wp-fg">
                  {t("detail.valuationTitle")}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <Price amount={L.value} size={22} symbolClassName="text-wp-teal-deep" />
                <span
                  className={cn(
                    "font-wp text-[12.5px] font-bold",
                    valDelta > 0 ? "text-wp-rose" : valDelta < 0 ? "text-wp-green" : "text-wp-fg-muted",
                  )}
                >
                  {valDelta > 0
                    ? t("detail.aboveValuation", { delta: valDelta })
                    : valDelta < 0
                      ? t("detail.belowValuation", { delta: valDelta })
                      : t("detail.fairPrice")}
                </span>
              </div>
              {/* Not "IA" — it is a published, deterministic formula over IVs, level,
                  rarity and shininess. Calling a rules engine AI would be a lie the
                  seller then has to live with. */}
              <p className="mt-2 font-wp text-[11.5px] font-semibold leading-relaxed text-wp-fg-muted">
                {t("detail.valuationExplain", {
                  shinyPart: mon.shiny ? t("detail.valuationShinyPart") : "",
                })}
              </p>
            </ValueBox>

            <Panel className="p-3.5">
              <div className="mb-1.5 flex items-center gap-[7px]">
                <Icon name="history" size={15} className="text-wp-fg-muted" />
                <span className="font-wp text-[13px] font-bold text-wp-fg">
                  {t("trust.priceHistory")}
                </span>
                <span className="ml-auto font-wp text-[11px] font-semibold text-wp-fg-subtle">
                  {t("detail.realSalesOf", { species: mon.species })}
                </span>
              </div>
              <PriceChart data={history ?? []} />
            </Panel>

            <Panel
              className="cursor-pointer p-3.5"
              onClick={() => router.push(`/smartrotom/wigglypop/vendedor/${L.seller.uuid}`)}
            >
              <div className="flex items-center gap-3">
                <Avatar seller={L.seller} />
                <div className="min-w-0 flex-1">
                  <div className="font-wp text-[15px] font-bold text-wp-fg">
                    {L.seller.username}
                  </div>
                  <div className="mt-0.5 flex items-center gap-[7px]">
                    <Stars value={L.seller.rating} size={12} />
                    {L.seller.rating === null ? (
                      <span className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                        {t("detail.newSellerNoRatings")}
                      </span>
                    ) : (
                      <>
                        <span className="wp-num font-wp text-[12px] text-wp-fg-muted">
                          {L.seller.rating.toFixed(2)}
                        </span>
                        <span className="font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                          · <span className="wp-num">{fmt(L.seller.sales)}</span> {t("detail.salesSuffix")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Icon name="arrowR" size={16} className="text-wp-fg-subtle" />
              </div>
            </Panel>

            <TrustBadges listing={L} />
          </div>
        </div>
      </div>

      {sheet === "buy" && <BuyModal listing={L} onClose={() => setSheet(null)} />}
      {sheet === "bid" && <BidModal listing={L} onClose={() => setSheet(null)} />}
      {sheet === "offer" && <OfferModal listing={L} onClose={() => setSheet(null)} />}
      {sheet === "trade" && <TradeModal listing={L} onClose={() => setSheet(null)} />}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex-1 p-[26px]">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <Skeleton className="h-[420px] rounded-wp" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-2/3 rounded-wp-sm" />
          <Skeleton className="h-24 rounded-wp" />
          <Skeleton className="h-56 rounded-wp" />
        </div>
      </div>
    </div>
  )
}
