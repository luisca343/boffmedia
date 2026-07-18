"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"

declare global {
  interface Window {
    /** Optional: the mod calls it only if the page defined it, and only the PC does. */
    terasStorageChanged?: () => void
  }
}

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
 * `window.terasStorageChanged` closes the second half of that: the mod pushes it on
 * every in-game storage write, so the long `staleTime` no longer means stale data.
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

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    // Registered here rather than globally because the mod broadcasts to every open
    // browser: a global handler would refetch 900 Pokémon on a catch made while the
    // player is on the Pokédex. Trailing debounce because our own moves echo back —
    // a bulk "Organizar caja" is ~30 sequential /pc/move calls, so ~30 echoes.
    window.terasStorageChanged = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        void client.invalidateQueries({ queryKey: ["pc"] })
      }, 750)
    }
    return () => {
      clearTimeout(timer)
      delete window.terasStorageChanged
    }
  }, [client])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
