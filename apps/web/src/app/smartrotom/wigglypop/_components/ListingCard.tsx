"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { WpListing } from "../_types/market.types"
import { FORMAT_ICON, FORMAT_LABEL_KEY, fmt } from "../_utils/format"
import { RARITY_HOVER, RARITY_STRIP } from "../_utils/rarity"
import {
  Chip,
  CornerBadge,
  Countdown,
  Icon,
  IVMeter,
  Price,
  RarityBadge,
  Sprite,
  SpriteStage,
  TypeBadge,
} from "./ui"

/**
 * The listing card — the atom of the whole marketplace, and the thing a buyer scans
 * sixty of at a time. Three variants: `cozy` (default), `compact` (denser grid, used
 * by "similares" and the seller profile) and `list` (a row).
 *
 * The card is built around one idea: **the four things worth scanning are readable
 * without stopping.** Rarity is the strip along the top edge and the word in the
 * body; shiny/legendary are the badges on the art; the price is teal-marked; the
 * format is a badge only when it is NOT "cómpralo ya" (the default needs no label,
 * and badging all four would badge every card into noise).
 */

function FormatLine({ L }: { L: WpListing }) {
  const t = useTranslations("wigglypop")
  if (L.format === "auction") {
    return (
      <div className="flex items-center justify-between gap-1.5">
        <div>
          <div className="font-wp text-[10px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
            {t("common.bidsCount", { count: L.bids ?? 0 })}
          </div>
          <Price amount={L.currentBid ?? L.price} size={16} />
        </div>
        {L.endsAt && <Countdown endsAt={L.endsAt} />}
      </div>
    )
  }

  if (L.format === "offer") {
    return (
      <div className="flex items-center justify-between gap-1.5">
        <div>
          <div className="font-wp text-[10px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
            {t("card.offerPriceLabel")}
          </div>
          <Price amount={L.price} size={16} />
        </div>
        <Chip className="border-wp-violet/35 text-wp-violet">
          <Icon name="handshake" size={12} />
          {t("card.offersCountLabel", { count: L.offers ?? 0 })}
        </Chip>
      </div>
    )
  }

  if (L.format === "trade") {
    return (
      <div>
        <div className="mb-0.5 font-wp text-[10px] font-bold uppercase tracking-[.06em] text-wp-fg-subtle">
          {t("card.seeksLabel")}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-wp text-[12.5px] font-semibold text-wp-fg">
          <Icon name="swap" size={13} className="text-wp-teal" />
          {(L.wants ?? []).join(" · ")}
          {L.tradePlus && <span className="text-wp-fg-subtle">{t("card.tradePlusExtra")}</span>}
        </div>
      </div>
    )
  }

  // fixed
  const under = L.price < L.value
  return (
    <div className="flex items-baseline gap-2">
      <Price amount={L.price} size={18} />
      {under && (
        <span className="font-wp text-[11px] font-bold text-wp-green">
          −{Math.round((1 - L.price / L.value) * 100)}%
        </span>
      )}
    </div>
  )
}

export interface ListingCardProps {
  listing: WpListing
  variant?: "cozy" | "compact" | "list"
  watched: boolean
  onWatch: () => void
  watchBusy?: boolean
  onOpen: () => void
}

export function ListingCard({
  listing: L,
  variant = "cozy",
  watched,
  onWatch,
  watchBusy = false,
  onOpen,
}: ListingCardProps) {
  const t = useTranslations("wigglypop")
  const { number } = useFormat()
  const mon = L.mons[0]
  const compact = variant === "compact"

  // A bundle or an item listing has no single hero Pokémon; those get their own
  // cards (BundleCard / ItemCard). Guarding rather than crashing.
  if (!mon) return null

  const WatchButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onWatch()
      }}
      disabled={watchBusy}
      aria-label={watched ? t("common.unwatch") : t("common.watch")}
      aria-pressed={watched}
      className={cn(
        "disabled:pointer-events-none disabled:opacity-60",
        "absolute right-2.5 top-2.5 z-[5] flex h-[34px] w-[34px] items-center justify-center rounded-wp-pill border-wp",
        "shadow-[0_4px_10px_-5px_rgba(120,70,100,.4)] transition-all duration-150 ease-wp",
        "hover:scale-110 motion-reduce:transform-none",
        watched
          ? "border-wp-accent bg-wp-accent text-white"
          : "border-wp-line/24 bg-white/90 text-wp-fg-subtle hover:border-wp-accent hover:text-wp-accent",
      )}
    >
      <Icon name="bookmark" size={15} filled={watched} />
    </button>
  )

  if (variant === "list") {
    return (
      <div
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className={cn(
          "wp-glass relative cursor-pointer overflow-hidden rounded-wp border-wp border-wp-line/24",
          "transition-[transform,border-color,box-shadow] duration-200 ease-wp motion-reduce:transform-none",
          "hover:-translate-y-[5px]",
          RARITY_HOVER[L.rarity],
        )}
      >
        <div className={cn("absolute inset-x-0 top-0 z-[3] h-1", RARITY_STRIP[L.rarity])} />
        <div className="grid grid-cols-[90px_1fr_auto] items-center gap-4 px-[15px] py-3">
          <SpriteStage mon={mon} dots={false} className="h-[90px] w-[90px] rounded-[14px]">
            <Sprite mon={mon} className="relative z-[2] h-[76%] w-[76%]" />
          </SpriteStage>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-wp text-[15px] font-bold text-wp-fg">
                {mon.shiny && <span className="text-wp-teal">✦ </span>}
                {mon.name}
              </span>
              <span className="wp-num font-wp text-[12px] text-wp-fg-subtle">{t("common.levelDot", { level: mon.level })}</span>
              <RarityBadge rarity={L.rarity} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {mon.types.map((ty) => (
                <TypeBadge key={ty} type={ty} size="sm" />
              ))}
              <Chip className="text-[10.5px]">{mon.nature}</Chip>
              <span className="wp-num font-wp text-[11.5px] text-wp-fg-muted">{t("card.ivPercent", { pct: mon.ivPct })}</span>
              <IVMeter ivs={mon.ivs} />
            </div>
            <div className="mt-1.5 flex items-center gap-2 font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
              <span>{L.seller.username}</span>
              <span>· {number(L.views)} {t("common.viewsSuffix")}</span>
            </div>
          </div>

          <div className="min-w-[140px] text-right">
            <Chip className="mb-1.5 text-[10.5px]">
              <Icon name={FORMAT_ICON[L.format]} size={12} />
              {t(FORMAT_LABEL_KEY[L.format])}
            </Chip>
            <div className="flex flex-col items-end gap-0.5">
              <Price amount={L.format === "auction" ? (L.currentBid ?? L.price) : L.price} size={18} />
              {L.format === "auction" && L.endsAt && <Countdown endsAt={L.endsAt} />}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-wp border-wp border-wp-line/24 bg-white shadow-wp-soft",
        "transition-[transform,border-color,box-shadow] duration-200 ease-wp motion-reduce:transform-none",
        "hover:-translate-y-[5px]",
        RARITY_HOVER[L.rarity],
        mon.shiny && "border-wp-teal/45",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 z-[3] h-1", RARITY_STRIP[L.rarity])} />

      <div className="absolute left-2.5 top-2.5 z-[4] flex flex-col items-start gap-1.5">
        {mon.shiny && (
          <CornerBadge tone="shiny">
            <Icon name="sparkles" size={11} />
            {t("common.shinyBadge")}
          </CornerBadge>
        )}
        {mon.legendary && (
          <CornerBadge tone="legend">
            <Icon name="crown" size={11} filled />
            {t("common.legendaryBadge")}
          </CornerBadge>
        )}
        {/* "Cómpralo ya" is the default and gets no badge — badging all four
            formats would badge every card, which is the same as badging none. */}
        {L.format !== "fixed" && (
          <CornerBadge tone="neutral">
            <Icon name={FORMAT_ICON[L.format]} size={11} />
            {t(FORMAT_LABEL_KEY[L.format])}
          </CornerBadge>
        )}
      </div>

      {WatchButton}

      <SpriteStage mon={mon} className="aspect-[1.16] w-full">
        <Sprite
          mon={mon}
          className={cn(
            "relative z-[2] h-[72%] w-[72%]",
            "transition-transform duration-300 ease-wp motion-reduce:transform-none",
            "group-hover:scale-[1.09]",
          )}
        />
      </SpriteStage>

      <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3">
        <div className="flex items-start justify-between gap-1.5">
          <div className="font-wp-display text-base font-semibold leading-tight text-wp-fg">
            {mon.name}
          </div>
          <span className="wp-num mt-0.5 whitespace-nowrap font-wp text-[11.5px] text-wp-fg-subtle">
            {t("common.levelDot", { level: mon.level })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {mon.types.map((ty) => (
            <TypeBadge key={ty} type={ty} size="sm" />
          ))}
          {!compact && <RarityBadge rarity={L.rarity} />}
        </div>

        {!compact && (
          <div className="flex items-center gap-2 font-wp text-[11.5px] font-semibold text-wp-fg-muted">
            <span className="wp-num">{t("card.ivPercent", { pct: mon.ivPct })}</span>
            <IVMeter ivs={mon.ivs} />
            <span className="ml-auto text-wp-fg-subtle">{mon.nature}</span>
          </div>
        )}

        <div className="mt-0.5">
          <FormatLine L={L} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-wp-line/24 pt-2.5">
          <span className="min-w-0 truncate font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
            {L.seller.username}
          </span>
          <span className="flex items-center gap-1 font-wp text-[11px] font-semibold text-wp-fg-subtle">
            <Icon name="bookmark" size={11} />
            <span className="wp-num">{fmt(L.watchers)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
