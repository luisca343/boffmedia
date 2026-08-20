"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Rooker's TanStack Query client, scoped to this route like the
 * Taxi's and the Arcade's.
 *
 * A timeline is the one place in SmartRotom where `refetchOnWindowFocus` earns its
 * keep: coming back to the tab and seeing the same trinos you left, with the same
 * counts, is the tell that a feed is dead. `staleTime` keeps that from turning into a
 * refetch on every alt-tab.
 */
export function RookerQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
