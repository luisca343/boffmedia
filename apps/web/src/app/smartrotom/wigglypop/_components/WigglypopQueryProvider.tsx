"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Scoped TanStack Query client for Wigglypop, mirroring `FurretQueryProvider` and
 * `ArcadeQueryProvider`. Kept local to this route so the marketplace's fetching
 * does not touch the rest of SmartRotom's imperative data layer.
 *
 * `staleTime` is much shorter here than in the other apps (15s, not 60s): a
 * marketplace's prices, bids and stock genuinely move under you, and a stale feed
 * means a buyer clicks Comprar on a listing someone else already bought. The
 * auctions in particular are the reason this is not a minute.
 */
export function WigglypopQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            gcTime: 5 * 60_000,
            // Unlike the read-only apps, refetching on focus IS wanted here — coming
            // back to the tab should not show you a price that has since changed.
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
