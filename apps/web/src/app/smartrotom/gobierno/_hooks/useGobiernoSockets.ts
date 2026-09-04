"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import useSocketStore from "@/stores/useSocketStore"
import { gobKeys } from "./queries"

/**
 * Keeps the Gobierno staff lists current without an F5.
 *
 * The socket is an INVALIDATION SIGNAL, not a second copy of the data: every
 * event just marks the relevant query stale and React Query refetches through
 * the same endpoint the page already trusts. Nothing here parses a payload, so
 * an event can never disagree with the list.
 *
 * Two things this has to get right, both of which the first version did not:
 *
 * The socket does not exist yet on first render. `useSocketStore` starts at
 * null and fills in after the handshake, so the effect depends on `socket` and
 * re-registers when it arrives. Reading `socket.connected` once at mount and
 * bailing out registered nothing at all on an ordinary page load — the feature
 * was inert exactly when it was needed.
 *
 * A reconnect has a hole behind it. Events emitted while the tab was offline
 * are gone, so `connect` invalidates everything: the lists are cheap and being
 * briefly wrong is the failure this whole hook exists to prevent.
 */
export function useGobiernoSockets() {
  const queryClient = useQueryClient()
  const { socket } = useSocketStore()

  useEffect(() => {
    if (!socket) return
    return subscribeGobierno(socket, (queryKey) => queryClient.invalidateQueries({ queryKey }))
  }, [socket, queryClient])
}

type MinimalSocket = {
  on: (event: string, handler: () => void) => void
  off: (event: string, handler: () => void) => void
}

/**
 * The event-to-invalidation table, and the subscribe/unsubscribe pair over it.
 *
 * Split out of the hook so it can be tested at all: jsdom cannot start in this
 * workspace (ERR_REQUIRE_ESM out of html-encoding-sniffer), so `renderHook` is
 * unavailable and a React-shaped test here would be no test at all. Everything
 * that can be wrong in this file except the dependency array lives in here.
 */
export function subscribeGobierno(
  socket: MinimalSocket,
  invalidate: (queryKey: readonly unknown[]) => void,
): () => void {
  const all = () => {
    invalidate(gobKeys.denuncias({}))
    invalidate(gobKeys.expedientes({}))
    invalidate(gobKeys.multas({}))
    invalidate(gobKeys.apelaciones({}))
  }

  const listeners: Array<[string, () => void]> = [
    ["gobierno:denuncia:created", () => invalidate(gobKeys.denuncias({}))],
    ["gobierno:denuncia:resolved", () => invalidate(gobKeys.denuncias({}))],
    ["gobierno:expediente:created", () => invalidate(gobKeys.expedientes({}))],
    ["gobierno:expediente:evento", () => invalidate(gobKeys.expedientes({}))],
    ["gobierno:multa:created", () => invalidate(gobKeys.multas({}))],
    [
      "gobierno:multa:status_changed",
      () => {
        invalidate(gobKeys.multas({}))
        invalidate(gobKeys.apelaciones({}))
      },
    ],
    // Events emitted while the tab was offline are gone, so a reconnect refetches
    // everything rather than leaving a hole behind.
    ["connect", all],
  ]

  for (const [event, handler] of listeners) socket.on(event, handler)
  return () => {
    for (const [event, handler] of listeners) socket.off(event, handler)
  }
}
