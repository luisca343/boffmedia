"use client"

import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import { fmt } from "../_utils/format"
import { PRICE_CAP, useFeedFilters, type WpSort } from "../_stores/filterStore"
import { useListings, useToggleWatch, useWatchlist } from "../_hooks/queries"
import { ListingCard } from "./ListingCard"
import { Button, EmptyState, Icon, Seg, Skeleton, Tabs } from "./ui"

const FORMAT_TABS = [
  { key: "all", label: "Todo", icon: "grid" },
  { key: "fixed", label: "Cómpralo ya", icon: "cart" },
  { key: "auction", label: "Subastas", icon: "gavel" },
  { key: "offer", label: "Ofertas", icon: "handshake" },
  { key: "trade", label: "Intercambios", icon: "swap" },
] as const

const SORTS: Array<[WpSort, string]> = [
  ["relevance", "Relevancia"],
  ["price-asc", "Precio: menor"],
  ["price-desc", "Precio: mayor"],
  ["iv", "Mejores IVs"],
  ["recent", "Más recientes"],
  ["ending", "Termina pronto"],
]

/** The discovery grid. A thin orchestrator (§12) — the filters live in the store,
 *  the fetching in `_hooks/queries`, and every card is a `ListingCard`. */
export function Feed() {
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
    return all.filter((L) => L.mons[0]?.types.some((t) => f.types.includes(t)))
  }, [data?.items, f.types])

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none px-[26px] pt-[18px]">
        <div className="flex flex-wrap items-center gap-3.5">
          <Tabs
            tabs={FORMAT_TABS}
            value={f.format}
            onChange={(k) => f.setFormat(k as typeof f.format)}
          />

          <div className="ml-auto flex items-center gap-2.5">
            <span className="font-wp text-[12.5px] font-semibold text-wp-fg-subtle">
              {/* With a type filter on, the server's `total` counts rows we have since
                  filtered out here — so the honest number is what is actually on screen. */}
              <b className="wp-num text-wp-fg-muted">
                {fmt(f.types.length ? listings.length : (data?.total ?? 0))}
              </b>{" "}
              resultados
            </span>

            <div className="flex items-center gap-[7px]">
              <Icon name="sort" size={15} className="text-wp-fg-subtle" />
              <select
                value={f.sort}
                onChange={(e) => f.setSort(e.target.value as WpSort)}
                aria-label="Ordenar por"
                className={cn(
                  "cursor-pointer appearance-none rounded-wp-sm border-wp border-wp-line/24 bg-white py-2 pl-[11px] pr-8",
                  "font-wp text-[13px] font-bold text-wp-fg outline-none",
                  "focus:border-wp-accent focus:shadow-[0_0_0_4px_rgb(var(--wp-accent)/.13)]",
                )}
              >
                {SORTS.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <Seg
              options={[
                { key: "cozy", icon: "grid", title: "Cuadrícula" },
                { key: "list", icon: "list", title: "Lista" },
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
            title="El mercado no responde"
            body={userMessageFrom(error, "Inténtalo de nuevo en unos segundos.")}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-[18px] px-[26px] pb-11 pt-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[330px] rounded-wp" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="filter"
            title="Sin resultados"
            body="Prueba a ajustar los filtros o el rango de precio."
          >
            <Button onClick={f.clear}>
              <Icon name="refresh" size={14} />
              Restablecer
            </Button>
          </EmptyState>
        ) : (
          <div
            className={cn(
              "grid px-[26px] pb-11 pt-5",
              f.density === "list"
                ? "grid-cols-1 gap-[11px]"
                : "grid-cols-[repeat(auto-fill,minmax(236px,1fr))] gap-[18px]",
            )}
          >
            {listings.map((L) => (
              <ListingCard
                key={L.id}
                listing={L}
                variant={f.density === "list" ? "list" : "cozy"}
                watched={watchedIds.has(L.id)}
                onWatch={() => toggleWatch.mutate(L.id)}
                onOpen={() => router.push(`/smartrotom/wigglypop/anuncio/${L.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
