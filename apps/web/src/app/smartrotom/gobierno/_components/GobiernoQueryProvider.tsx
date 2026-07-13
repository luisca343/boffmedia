"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Scoped TanStack Query client for the Gobierno, mirroring `TaxiQueryProvider`. Kept local
 * to this route so this app's fetching stays cached, deduped and abortable without touching
 * the rest of SmartRotom's still-imperative data layer (audit gap G5).
 *
 * Money mutations invalidate across domains on purpose: paying a fine moves the multa, the
 * treasury balance AND the audit log, so they are refetched together.
 */
export function GobiernoQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
