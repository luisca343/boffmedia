"use client"

import { useEffect } from "react"
import { usePokemonStore } from "@/stores/pokemonStore"
import useSocketStore from "@/stores/useSocketStore"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"

/**
 * Keeps the Pokédex current when captures happen on the server.
 *
 * The socket is an INVALIDATION SIGNAL, not a data channel: every event
 * from the server marks the dex stale and we refetch through the same
 * endpoint the page already trusts. Nothing here parses a capture payload,
 * so an event can never disagree with what the API says.
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
 * are gone, so `connect` refetches the dex: the capture data is cheap and being
 * briefly wrong is the failure this whole hook exists to prevent.
 *
 * The uuid check is the third. The server now addresses these events to the one
 * player they concern, but this listener still refuses an event carrying someone
 * else's uuid, because the first version had NEITHER guard: the server broadcast
 * to every socket and this hook invalidated on any event, so one player's capture
 * made every connected player refetch their entire Pokédex.
 */
export function usePokedexSockets() {
  const invalidatePokedex = usePokemonStore((state) => state.invalidatePokedex)
  const { socket } = useSocketStore()
  const uuid = useRotomUuid()

  useEffect(() => {
    if (!socket) return
    return subscribePokedex(socket, invalidatePokedex, uuid)
  }, [socket, invalidatePokedex, uuid])
}

type MinimalSocket = {
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler: (...args: any[]) => void) => void
}

/**
 * The event-to-invalidation logic, split out of the hook so it can be tested.
 * jsdom cannot start in this workspace, so `renderHook` is unavailable and
 * a React-shaped test would be no test at all. Everything that can be wrong
 * in this file except the dependency array lives in here.
 */
export function subscribePokedex(
  socket: MinimalSocket,
  invalidate: () => void,
  uuid?: string | null,
): () => void {
  // Only this viewer's dex. An event for someone else is not our staleness,
  // and acting on it is what turned one capture into N refetches. When we do
  // not know our own uuid yet we cannot attribute the event, so we ignore it:
  // the `connect` refetch below and the store TTL both still cover us.
  const mine = (event: unknown) => {
    const owner = (event as { uuid?: unknown } | null)?.uuid
    if (typeof owner !== "string") return
    if (!uuid || owner !== uuid) return
    invalidate()
  }

  const listeners: Array<[string, (...args: any[]) => void]> = [
    ["pokedex:capture", mine],
    ["pokedex:updated", mine],
    // Events emitted while the tab was offline are gone, so a reconnect
    // refetches the dex rather than leaving a hole behind. Unconditional on
    // purpose: a reconnect is about OUR connection, not about whose event it is.
    ["connect", invalidate],
  ]

  for (const [event, handler] of listeners) socket.on(event, handler)
  return () => {
    for (const [event, handler] of listeners) socket.off(event, handler)
  }
}
