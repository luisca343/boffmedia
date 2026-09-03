"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import { fmt } from "../_utils/format"
import { PRICE_CAP, useFeedFilters, type WpSort } from "../_stores/filterStore"
import { useListings, useToggleWatch, useWatchlist } from "../_hooks/queries"
import { ListingCard } from "./ListingCard"
import { Button, EmptyState, Icon, Seg, Skeleton, Tabs } from "./ui"

const FORMAT_TABS = [
  { key: "all", labelKey: "feed.tabAll", icon: "grid" },
  { key: "fixed", labelKey: "feed.tabFixed", icon: "cart" },
  { key: "auction", labelKey: "feed.tabAuction", icon: "gavel" },
  { key: "offer", labelKey: "feed.tabOffer", icon: "handshake" },
  { key: "trade", labelKey: "feed.tabTrade", icon: "swap" },
] as const

const SORTS: Array<[WpSort, string]> = [
  ["relevance", "feed.sortRelevance"],
  ["price-asc", "feed.sortPriceAsc"],
  ["price-desc", "feed.sortPriceDesc"],
  ["iv", "feed.sortIv"],
  ["recent", "feed.sortRecent"],
  ["ending", "feed.sortEnding"],
]

/** The discovery grid. A thin orchestrator — the filters live in the store,
 *  the fetching in `_hooks/queries`, and every card is a `ListingCard`. */
export function Feed() {
  const t = useTranslations("wigglypop")
  const router = useRouter()
  const f = useFeedFilters()
  const toggleWatch = useToggleWatch()
  const { data: watched } = useWatchlist()

  const watchedIds = useMemo(
    () => new Set((watched ?? []).map((l) => l.id)),
    [watched],
  )

  const query = useMemo(
    () => ({
      kind: "mon",
      search: f.search || undefined,
      format: f.format === "all" ? undefined : f.format,
      rarities: f.rarities.length ? f.rarities : undefined,
      // `types` is deliberately NOT sent. The server accepts the param but can never
      // apply it — a listing's snapshot has no type data, because the Pixelmon `/pc`
      // payload does not carry any. Types exist only here, derived from the Pokédex
      // species store at the query boundary, so the filter has to run here too.
      shinyOnly: f.shinyOnly || undefined,
      legendaryOnly: f.legendaryOnly || undefined,
      perfectOnly: f.perfectOnly || undefined,
      // At the cap the slider means "no ceiling" — sending 60000 would hide every
      // legendary shiny on the market, which is the opposite of what the user did.
      priceMax: f.priceMax < PRICE_CAP ? f.priceMax : undefined,
      sort: f.sort,
      limit: 100,
    }),
    [f.search, f.format, f.rarities, f.shinyOnly, f.legendaryOnly, f.perfectOnly, f.priceMax, f.sort],
  )

  const { data, isLoading, error } = useListings(query)

  // The one filter the server cannot do. See the note in `query` above.
  const listings = useMemo(() => {
    const all = data?.items ?? []
    if (f.types.length === 0) return all
    return all.filter((L) => L.mons[0]?.types.some((ty) => f.types.includes(ty)))
  }, [data?.items, f.types])

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none px-[1.625rem] pt-[1.125rem]">
        <div className="flex flex-wrap items-center gap-3.5">
          <Tabs
            tabs={FORMAT_TABS.map((tb) => ({ ...tb, label: t(tb.labelKey) }))}
            value={f.format}
            onChange={(k) => f.setFormat(k as typeof f.format)}
          />

          <div className="ml-auto flex items-center gap-2.5">
            <span className="font-wp text-[0.78125rem] font-semibold text-wp-fg-subtle">
              {/* With a type filter on, the server's `total` counts rows we have since
                  filtered out here — so the honest number is what is actually on screen. */}
              <b className="wp-num text-wp-fg-muted">
                {fmt(f.types.length ? listings.length : (data?.total ?? 0))}
              </b>{" "}
              {t("feed.resultsLabel")}
            </span>

            <div className="flex items-center gap-[0.4375rem]">
              <Icon name="sort" size={15} className="text-wp-fg-subtle" />
              <select
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value as WpSort)}
                aria-label={t("feed.sortAriaLabel")}
                className={cn(
                  "cursor-pointer appearance-none rounded-wp-sm border-wp border-wp-line/24 bg-white py-2 pl-[0.6875rem] pr-8",
                  "font-wp text-[0.8125rem] font-bold text-wp-fg outline-none",
                  "focus:border-wp-accent focus:shadow-[0_0_0_4px_rgb(var(--wp-accent)/.13)]",
                )}
              >
                {SORTS.map(([k, labelKey]) => (
                  <option key={k} value={k}>
                    {t(labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <Seg
              options={[
                { key: "cozy", icon: "grid", title: t("feed.densityGrid") },
                { key: "list", icon: "list", title: t("feed.densityList") },
              ]}
              value={f.density}
              onChange={(d) => f.setDensity(d as typeof f.density)}
            />
          </div>
        </div>
      </div>

      <div className="wp-scroll min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <EmptyState
            icon="alert"
            title={t("feed.errorTitle")}
            body={userMessageFrom(error, t("common.retryFallback"))}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14.75rem,1fr))] gap-[1.125rem] px-[1.625rem] pb-11 pt-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[20.625rem] rounded-wp" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="filter"
            title={t("feed.noResultsTitle")}
            body={t("feed.noResultsBody")}
          >
            <Button onClick={f.clear}>
              <Icon name="refresh" size={14} />
              {t("feed.resetButton")}
            </Button>
          </EmptyState>
        ) : (
          <div
            className={cn(
              "grid px-[1.625rem] pb-11 pt-5",
              f.density === "list"
                ? "grid-cols-1 gap-[0.6875rem]"
                : "grid-cols-[repeat(auto-fill,minmax(14.75rem,1fr))] gap-[1.125rem]",
            )}
          >
            {listings.map((L) => (
              <ListingCard
                key={L.id}
                listing={L}
                variant={f.density === "list" ? "list" : "cozy"}
                watched={watchedIds.has(L.id)}
                onWatch={() => toggleWatch.mutate(L.id)}
                watchBusy={toggleWatch.isPending}
                onOpen={() => router.push(`/smartrotom/wigglypop/anuncio/${L.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
