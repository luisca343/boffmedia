"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { WigglypopService } from "@/services/api/smartrotom/wigglypopService"
import { useQuery } from "@tanstack/react-query"
import { fmt } from "../../_utils/format"
import { useCreateListing, useWpUuid } from "../../_hooks/queries"
import {
  Button,
  Chip,
  EmptyState,
  Icon,
  Input,
  Price,
  PriceInput,
  Select,
  Skeleton,
  ValueBox,
} from "../ui"

interface CatalogItem {
  id: string
  name: string
  category: string
  refPrice: number
}

/**
 * List an item.
 *
 * This is the honest half of the marketplace. The game server can **give** items
 * (`/giveitems`) but it cannot **read** a player's bag and it cannot take items back
 * — so unlike a Pokémon, we cannot verify that you own what you are listing.
 *
 * Rather than fake a bag, the seller DECLARES what they are selling from a catalogue
 * we own, and the UI says so plainly: an item listing gets no "propiedad verificada"
 * badge, and the buyer is told the seller hands it over in-game. Delivery is still
 * real (the item is genuinely `/giveitems`-ed on confirmation) — only ownership is
 * unverified, and pretending otherwise would be the lie.
 */
export function SellItem() {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const uuid = useWpUuid()
  const createListing = useCreateListing()

  const [picked, setPicked] = useState<CatalogItem | null>(null)
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)
  const [search, setSearch] = useState("")
  const [published, setPublished] = useState(false)

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["wigglypop", "item-catalog"],
    queryFn: async () => {
      const res = await WigglypopService.getItemCatalog<CatalogItem[]>()
      if (!res.success || !res.data) throw new Error(res.userMessage ?? "Sin catálogo")
      return res.data
    },
    staleTime: 30 * 60_000,
  })

  const results = (catalog ?? []).filter((it) =>
    it.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function choose(it: CatalogItem) {
    setPicked(it)
    setPrice(it.refPrice)
    setQty(1)
  }

  function publish() {
    if (!picked || !uuid) return
    createListing.mutate(
      {
        sellerUuid: uuid,
        kind: "item",
        format: "fixed",
        title: picked.name,
        price: price * qty,
        escrow: true,
        item: {
          itemId: picked.id,
          itemName: picked.name,
          category: picked.category,
          qty,
          unitPrice: price,
        },
      },
      { onSuccess: () => setPublished(true) },
    )
  }

  if (published && picked) {
    return (
      <div className="mx-auto mt-10 max-w-[28.75rem] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-wp-pill border border-wp-accent bg-wp-accent/[.13]">
          <Icon name="tag" size={28} className="text-wp-accent" />
        </div>
        <h2 className="font-wp-display text-[1.375rem] font-semibold text-wp-fg">{t("sell.item.publishedTitle")}</h2>
        <p className="mt-2 font-wp text-[0.84375rem] font-semibold leading-relaxed text-wp-fg-muted">
          <b className="text-wp-fg">
            {qty}× {picked.name}
          </b>{" "}
          {t("sell.item.publishedBody", { price: fmt(price) })}
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button
            onClick={() => {
              setPicked(null)
              setPublished(false)
            }}
          >
            {t("common.publishAnother")}
          </Button>
          <Button variant="primary" onClick={() => router.push("/smartrotom/wigglypop/anuncios")}>
            {t("common.viewMyListings")}
          </Button>
        </div>
      </div>
    )
  }

  if (!picked) {
    return (
      <div className="mx-auto max-w-[57.5rem]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-wp text-[0.8125rem] font-semibold text-wp-fg-muted">
            <Icon name="package" size={15} className="text-wp-accent" />
            {t("sell.item.catalogLabel")}
          </span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("sell.item.searchPlaceholder")}
            aria-label={t("sell.item.searchAria")}
            className="ml-auto max-w-[16.25rem]"
          />
        </div>

        {/* Said once, at the top, rather than apologised for later. */}
        <div className="mb-4 flex items-start gap-2 rounded-[11px] border border-wp-amber/25 bg-wp-amber/[.08] px-3 py-2.5">
          <Icon name="info" size={15} className="mt-px flex-none text-wp-amber" />
          <span className="font-wp text-[0.78125rem] font-semibold leading-relaxed text-wp-fg-muted">
            {t("sell.item.disclaimer")}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[7.5rem] rounded-wp" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon="package" title={t("sell.item.noMatchTitle")} body={t("sell.item.noMatchBody")} />
        ) : (
          <div className="grid grid-cols-3 gap-3 xl:grid-cols-4">
            {results.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => choose(it)}
                className={cn(
                  "flex flex-col rounded-wp border-wp border-wp-line/24 bg-white p-3.5 text-left shadow-wp-soft",
                  "transition-[transform,border-color,box-shadow] duration-200 ease-wp motion-reduce:transform-none",
                  "hover:-translate-y-1 hover:border-wp-accent hover:shadow-wp-card-hover",
                )}
              >
                <div className="font-wp text-[0.84375rem] font-bold leading-tight text-wp-fg">
                  {it.name}
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <Chip className="text-[0.625rem]">{it.category}</Chip>
                  <span className="wp-num font-wp text-[0.71875rem] font-bold text-wp-teal">
                    ~₽{fmt(it.refPrice)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const total = price * qty

  return (
    <div className="mx-auto max-w-[35rem]">
      <div className="rounded-wp border-wp border-wp-line/24 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-wp-display text-lg font-semibold text-wp-fg">{picked.name}</div>
            <Chip className="mt-2">{picked.category}</Chip>
          </div>
          <Button variant="ghost" onClick={() => setPicked(null)}>
            <Icon name="arrowL" size={14} />
            {t("common.pickAnother")}
          </Button>
        </div>

        <div className="mt-5">
          <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">{t("sell.item.qtyLabel")}</label>
          <div className="mt-1.5 flex items-center gap-2.5">
            <Button
              iconOnly
              aria-label={t("common.decrease")}
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Icon name="minus" size={16} />
            </Button>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              aria-label={t("sell.item.qtyLabel")}
              className="wp-num w-20 text-center"
            />
            <Button iconOnly aria-label={t("common.increase")} onClick={() => setQty((q) => q + 1)}>
              <Icon name="plus" size={16} />
            </Button>
          </div>
        </div>

        <ValueBox className="mt-4">
          <div className="flex items-center gap-2">
            <Icon name="wand" size={15} className="text-wp-teal" />
            <span className="font-wp text-[0.78125rem] font-bold text-wp-fg">{t("sell.item.refPriceLabel")}</span>
            <Price amount={picked.refPrice} size={16} symbolClassName="text-wp-teal-deep" />
            <span className="font-wp text-[0.6875rem] font-semibold text-wp-fg-subtle">{t("sell.item.perUnitSuffix")}</span>
            <Button className="ml-auto px-2.5 py-1 text-xs" onClick={() => setPrice(picked.refPrice)}>
              {t("common.useSuggested")}
            </Button>
          </div>
        </ValueBox>

        <div className="mt-4">
          <label className="font-wp text-[0.78125rem] font-semibold text-wp-fg-muted">
            {t("sell.item.unitPriceLabel")}
          </label>
          <div className="mt-1.5">
            <PriceInput
              value={price || ""}
              min={0}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-wp border border-wp-line/24 bg-wp-panel-2 px-4 py-3">
          <span className="font-wp text-[0.8125rem] font-semibold text-wp-fg-muted">
            {t("sell.item.incomeIfSold", { qty, price: fmt(price) })}
          </span>
          <Price amount={total} size={19} />
        </div>

        <Button
          variant="primary"
          className="mt-5 w-full py-3"
          disabled={!price || !qty || createListing.isPending}
          onClick={publish}
        >
          <Icon name="tag" size={15} />
          {createListing.isPending ? t("common.publishing") : t("sell.item.publishButton")}
        </Button>
      </div>
    </div>
  )
}
