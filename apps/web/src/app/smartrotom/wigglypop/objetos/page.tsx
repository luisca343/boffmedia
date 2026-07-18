"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import { fmt } from "../_utils/format"
import { useListings, useWpUuid } from "../_hooks/queries"
import { useCartStore } from "../_stores/cartStore"
import { BuyModal } from "../_components/modals/BuyModal"
import type { WpListing } from "../_types/market.types"
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  Price,
  Skeleton,
  Tabs,
  toast,
} from "../_components/ui"

/**
 * Objetos.
 *
 * Item listings are seller-DECLARED — there is no bag API on the game server, so
 * nobody has verified the seller actually has these. The escrow still protects the
 * buyer (you get your money back if they never hand it over), and delivery is real
 * (`/giveitems`), but the "Propiedad verificada" badge deliberately does not appear
 * on this page. The banner says so once, plainly, instead of the cards implying a
 * guarantee that does not exist.
 */
export default function ItemsPage() {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const uuid = useWpUuid()
  const [cat, setCat] = useState<string>("Todo")
  const [buying, setBuying] = useState<WpListing | null>(null)
  const addToCart = useCartStore((s) => s.add)

  const { data, isLoading, error } = useListings({ kind: "item", limit: 100 })
  const listings = data?.items ?? []

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const L of listings) {
      const c = L.items[0]?.category
      if (c) set.add(c)
    }
    return [...set]
  }, [listings])

  const shown = listings.filter((L) => cat === "Todo" || L.items[0]?.category === cat)

  const tabs = ["Todo", ...categories].map((c) => ({ key: c, label: c === "Todo" ? t("common.allLabel") : c }))

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none px-[26px] pt-[18px]">
        <div className="flex flex-wrap items-center gap-3.5">
          {tabs.length > 1 && <Tabs tabs={tabs} value={cat} onChange={setCat} />}
          <span className="ml-auto font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
            <b className="wp-num text-wp-fg-muted">{shown.length}</b> {t("objetos.itemsCountSuffix")}
          </span>
          <Button
            variant="primary"
            className="px-3.5 py-2 text-[13px]"
            onClick={() => router.push("/smartrotom/wigglypop/vender")}
          >
            <Icon name="plus" size={15} />
            {t("objetos.sellItemButton")}
          </Button>
        </div>

        <div className="mt-3.5 flex items-start gap-2 rounded-[11px] border border-wp-amber/25 bg-wp-amber/[.08] px-3 py-2.5">
          <Icon name="info" size={15} className="mt-px flex-none text-wp-amber" />
          <span className="font-wp text-[12.5px] font-semibold leading-relaxed text-wp-fg-muted">
            {t("objetos.disclaimer")}
          </span>
        </div>
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <EmptyState icon="alert" title={t("objetos.errorTitle")} body={userMessageFrom(error, t("common.retryFallback"))} />
        ) : isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-[18px] px-[26px] pb-11 pt-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-wp" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon="package"
            title={t("objetos.emptyTitle")}
            body={t("objetos.emptyBody")}
          >
            <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/vender")}>
              <Icon name="plus" size={15} />
              {t("objetos.sellItemButton")}
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-[18px] px-[26px] pb-11 pt-5">
            {shown.map((L) => {
              const it = L.items[0]
              if (!it) return null
              return (
                <div
                  key={L.id}
                  className={cn(
                    "flex flex-col rounded-wp border-wp border-wp-line/24 bg-white shadow-wp-soft",
                    "transition-[transform,border-color,box-shadow] duration-200 ease-wp motion-reduce:transform-none",
                    "hover:-translate-y-1 hover:border-wp-accent hover:shadow-wp-card-hover",
                  )}
                >
                  {/* No item sprites exist in the manifest (it only indexes Pokémon),
                      so the tile is a typographic one rather than a broken image. */}
                  <div className="wp-wall wp-wall-classic flex aspect-[1.6] items-center justify-center rounded-t-[16px]">
                    <div className="absolute inset-0 wp-dots" />
                    <Icon name="package" size={40} className="relative z-[2] text-wp-fg-subtle/70" />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3">
                    <div className="font-wp-display text-base font-semibold leading-tight text-wp-fg">
                      {it.name}
                    </div>
                    <Chip className="self-start text-[10.5px]">{it.category}</Chip>

                    <div className="mt-1 flex items-center justify-between">
                      <Price amount={it.unitPrice} size={17} />
                      <span className="wp-num font-wp text-[11px] font-semibold text-wp-fg-subtle">
                        {t("objetos.availableCount", { qty: fmt(it.qty) })}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-wp-line/24 pt-2.5">
                      <span className="truncate font-wp text-[11.5px] font-semibold text-wp-fg-subtle">
                        {L.seller.username}
                      </span>
                      {/* The server rejects buying your own listing, so don't offer
                          the button and then 400 — mark it as yours instead. */}
                      {uuid && L.seller.uuid === uuid ? (
                        <Chip className="text-[10.5px]">
                          <Icon name="tag" size={11} />
                          {t("common.yourListing")}
                        </Chip>
                      ) : (
                        <div className="flex gap-1.5">
                          <Button
                            iconOnly
                            aria-label={t("common.addToCartAria")}
                            className="h-[30px] w-[30px] p-0"
                            onClick={() => {
                              addToCart(L)
                              toast(t("toast.addedToCart"), "success")
                            }}
                          >
                            <Icon name="cart" size={14} />
                          </Button>
                          <Button
                            variant="primary"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => setBuying(L)}
                          >
                            {t("objetos.buyButton")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {buying && <BuyModal listing={buying} onClose={() => setBuying(null)} />}
    </div>
  )
}
