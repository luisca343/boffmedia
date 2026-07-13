"use client"

import { useEffect, type ReactNode } from "react"
import { usePokemonStore } from "@/stores/pokemonStore"
import {
  useBalance,
  useOrders,
  useSeller,
  useWatchlist,
  useWpUuid,
} from "../_hooks/queries"
import { useFeedFilters } from "../_stores/filterStore"
import { TopNav } from "./TopNav"

/**
 * The frame every Wigglypop route sits in: the top nav, and the two datasets the
 * nav's badges need. Kept out of `layout.tsx` because it is a client component that
 * reads the query cache — the layout's job is only to mount the scope root.
 */
export function WigglypopShell({ children }: { children: ReactNode }) {
  const uuid = useWpUuid()
  const search = useFeedFilters((s) => s.search)
  const setSearch = useFeedFilters((s) => s.setSearch)

  const allPokemon = usePokemonStore((s) => s.allPokemon)
  const fetchAllPokemon = usePokemonStore((s) => s.fetchAllPokemon)

  // The species list backs type derivation on every card (`typesOf` in queries.ts).
  // Fetched once, here, rather than by each of the sixty cards in the feed.
  useEffect(() => {
    if (allPokemon.length === 0) void fetchAllPokemon()
  }, [allPokemon.length, fetchAllPokemon])

  const { data: balance } = useBalance()
  const { data: watchlist } = useWatchlist()
  const { data: orders } = useOrders()
  const { data: me } = useSeller(uuid)

  // "Active" = the ball is in someone's court. A completed or refunded order is
  // history and must not keep a badge lit forever.
  const activeOrders = (orders ?? []).filter(
    (o) => o.status === "escrow" || o.status === "transferido",
  ).length

  return (
    <>
      <TopNav
        balance={balance ?? null}
        search={search}
        onSearch={setSearch}
        watchCount={watchlist?.length ?? 0}
        activeOrders={activeOrders}
        activeListings={me?.activeListings ?? 0}
      />
      <div className="flex min-h-0 flex-1">{children}</div>
    </>
  )
}
