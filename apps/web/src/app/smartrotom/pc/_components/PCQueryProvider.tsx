"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Scoped TanStack Query client for the PC, mirroring `ArcadeQueryProvider`.
 *
 * The PC is the app that most needed this: it was `useEffect` + `setState` over a
 * ~900-Pokémon payload with hand-rolled optimistic moves and manual rollback (audit
 * gap G5). Every move now invalidates the PC and the party together, because one
 * `POST /pc/move` can touch both.
 *
 * `staleTime` is long: the PC only changes when the player moves something here or
 * plays on the Minecraft server, and re-pulling 900 Pokémon on every focus is waste.
 */
export function PCQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
