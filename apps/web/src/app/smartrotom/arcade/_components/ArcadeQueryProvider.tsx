"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Scoped TanStack Query client for the arcade, mirroring `TaxiQueryProvider`.
 * Kept local to this route so lifting the arcade's fetching (audit gap G5 — it
 * was `useEffect` + `setState`, with no dedupe, abort or retry) does not touch
 * the rest of SmartRotom's still-imperative data layer.
 */
export function ArcadeQueryProvider({ children }: { children: ReactNode }) {
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
