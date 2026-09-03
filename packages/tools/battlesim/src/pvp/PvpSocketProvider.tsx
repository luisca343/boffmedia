"use client"

/**
 * The one PvP socket, shared by every screen that needs it.
 *
 * WHAT THIS REPLACES. The lobby opened a socket per mount and closed it on
 * unmount, then navigated to the room — which is a different mount, so the
 * socket the room needed had already been closed. The room papered over that by
 * reading `window.__pvp_socket`, a global `battleSocket.ts` stopped setting when
 * it was rewritten, so the room sat on "Cargando combate…" forever. The battle
 * SESSION travelled the same way, on `window.__pvp_sessions`.
 *
 * A provider mounted above the screen switch fixes both at once: the connection
 * outlives the navigation because it belongs to the tree the navigation happens
 * inside, and the session registry is a ref rather than a property of the
 * window object. Package rules forbid `window.__*` anyway — a global is a second
 * copy of state that nothing owns and nothing cleans up.
 *
 * WHY THE ENGINE IS NOT IMPORTED HERE. This provider is mounted EAGERLY, above
 * the lazy screen switch, and `engine/battleSocket` drags in socket.io while
 * `engine/BattleSession` drags in @pkmn/sim. Both would land in the hub's chunk
 * — the one screen that needs neither. So `BattleSession` is a TYPE-only import
 * (erased at compile time) and `battleSocket` is imported dynamically, inside
 * `connect()`, which is only ever called from a PvP screen.
 */

import * as React from "react"
import type { Socket } from "socket.io-client"
import { toolSession } from "@boffmedia/tool-kit"

import type { BattleSession } from "../engine/BattleSession"

/** The transport's own lifecycle, distinct from the matchmaking status. */
export type PvpTransportStatus = "idle" | "connecting" | "connected" | "error"

/**
 * What a screen in a battle needs to tell the player.
 *
 * Deliberately three values and not the socket's five: "reconnecting" covers
 * every state where socket.io still intends to get back, and "lost" is the one
 * where it does not. A battle screen needs to know whether to say "hold on" or
 * "this is over"; the distinction between a transport error and a namespace
 * error is not something to put in front of a player mid-turn.
 */
export type PvpConnection = "connected" | "reconnecting" | "lost"

export interface PvpSocketApi {
  /** Null until `connect()` resolves. */
  socket: Socket | null
  status: PvpTransportStatus
  /** For the in-battle banner. See {@link PvpConnection}. */
  connection: PvpConnection
  /**
   * Whether the OTHER player is still on the line.
   *
   * Always true today, and the honesty matters: `battle.gateway.ts` emits no
   * presence event for the opponent. It starts a grace timer on their
   * disconnect and, if they do not `resume` in time, forfeits the room — which
   * arrives here as `battleEnd`, not as a presence change. The field exists so
   * the render side has one place to read when the server grows the event;
   * until then nothing should paint an "opponent left" state, because nothing
   * knows.
   */
  opponentConnected: boolean
  /** A `BsimErrorCode` — `signin_required`, `connect_failed` — never a message. */
  error: string | null
  connect(): Promise<Socket | null>
  disconnect(): void
  /** The live session for a room, handed from the lobby to the room screen. */
  getRoomSession(roomId: string): BattleSession | null
  setRoomSession(roomId: string, session: BattleSession | null): void
  /** Which side you play in a room. Survives a reload; the server does not resend it. */
  getRoomSide(roomId: string): "p1" | "p2" | null
  setRoomSide(roomId: string, side: "p1" | "p2"): void
}

const PvpSocketContext = React.createContext<PvpSocketApi | null>(null)

export function usePvpSocket(): PvpSocketApi {
  const api = React.useContext(PvpSocketContext)
  if (!api) throw new Error("usePvpSocket must be used inside <PvpSocketProvider>")
  return api
}

/** Namespaced so it cannot collide with another tool's keys in the same origin. */
const sideKey = (roomId: string) => `bsim.pvp.side.${roomId}`

export function PvpSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = React.useRef<Socket | null>(null)
  // One in-flight open at a time: the lobby's effect and a `joinQueue` can both
  // ask before the first ticket has come back, and two sockets means two
  // identities on the same account.
  const pendingRef = React.useRef<Promise<Socket | null> | null>(null)
  const detachRef = React.useRef<(() => void) | null>(null)
  const sessionsRef = React.useRef(new Map<string, BattleSession>())

  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [status, setStatus] = React.useState<PvpTransportStatus>("idle")
  const [connection, setConnection] = React.useState<PvpConnection>("connected")
  const [error, setError] = React.useState<string | null>(null)

  const connect = React.useCallback(async (): Promise<Socket | null> => {
    if (socketRef.current) return socketRef.current
    if (pendingRef.current) return pendingRef.current

    const opening = (async (): Promise<Socket | null> => {
      setStatus("connecting")
      setError(null)

      // Asked BEFORE the ticket request, not after it fails: the ticket
      // endpoint is `auth: "required"`, so a signed-out visitor was sending a
      // request that could only ever come back 401 — a console error on a
      // screen whose correct answer ("sign in") we already knew.
      //
      // Only an EXPLICIT "anonymous" short-circuits. "loading" is not a no, and
      // treating it as one would show the sign-in wall to a signed-in player
      // whose session had not resolved yet.
      let anonymous = false
      try {
        anonymous = toolSession().status() === "anonymous"
      } catch {
        // No host configured (tests, a styleguide). Let the request decide.
        anonymous = false
      }
      if (anonymous) {
        setStatus("error")
        setError("signin_required")
        setConnection("lost")
        return null
      }

      let next: Socket
      try {
        const { openBattleSocket } = await import("../engine/battleSocket")
        next = await openBattleSocket("/battle")
      } catch {
        // We know there IS a session by here, so this is the API or the
        // network — never a missing account.
        setStatus("error")
        setError("connect_failed")
        setConnection("lost")
        return null
      }

      socketRef.current = next

      const onConnect = () => {
        setStatus("connected")
        setConnection("connected")
        setError(null)
      }
      // `io client disconnect` is us calling `.close()`; anything else is the
      // network, and socket.io is already retrying with a fresh ticket (see
      // `battleSocket.ts`'s `reconnect_attempt` hook).
      const onDisconnect = (reason: string) => {
        setConnection(reason === "io client disconnect" ? "lost" : "reconnecting")
      }
      const onConnectError = () => {
        if (next.active) {
          setConnection("reconnecting")
          return
        }
        setStatus("error")
        setError("connect_failed")
        setConnection("lost")
      }
      const onReconnectFailed = () => {
        setStatus("error")
        setError("connect_failed")
        setConnection("lost")
      }

      next.on("connect", onConnect)
      next.on("disconnect", onDisconnect)
      next.on("connect_error", onConnectError)
      next.io.on("reconnect", onConnect)
      next.io.on("reconnect_attempt", () => setConnection("reconnecting"))
      next.io.on("reconnect_failed", onReconnectFailed)

      detachRef.current = () => {
        next.off("connect", onConnect)
        next.off("disconnect", onDisconnect)
        next.off("connect_error", onConnectError)
        next.io.off("reconnect", onConnect)
        next.io.off("reconnect_failed", onReconnectFailed)
      }

      setSocket(next)
      setConnection(next.connected ? "connected" : "reconnecting")
      if (next.connected) setStatus("connected")
      return next
    })()

    // Cleared through `finally`, NOT from inside the body. An async function
    // runs synchronously up to its first `await`, and the anonymous branch
    // above returns before there is one — so a `pendingRef.current = null`
    // written in the body ran BEFORE the assignment below and was immediately
    // overwritten by the settled promise. `connect()` then returned that
    // resolved-null promise for the rest of the page's life, so a visitor who
    // signed in without reloading could never open a socket again.
    pendingRef.current = opening
    void opening.finally(() => {
      if (pendingRef.current === opening) pendingRef.current = null
    })
    return opening
  }, [])

  const disconnect = React.useCallback(() => {
    detachRef.current?.()
    detachRef.current = null
    socketRef.current?.close()
    socketRef.current = null
    pendingRef.current = null
    sessionsRef.current.clear()
    setSocket(null)
    setStatus("idle")
    setConnection("connected")
    setError(null)
  }, [])

  React.useEffect(() => () => {
    detachRef.current?.()
    socketRef.current?.close()
    socketRef.current = null
  }, [])

  const value = React.useMemo<PvpSocketApi>(
    () => ({
      socket,
      status,
      connection,
      opponentConnected: true,
      error,
      connect,
      disconnect,
      getRoomSession: (roomId) => sessionsRef.current.get(roomId) ?? null,
      setRoomSession: (roomId, session) => {
        if (session) sessionsRef.current.set(roomId, session)
        else sessionsRef.current.delete(roomId)
      },
      getRoomSide: (roomId) => {
        try {
          const raw = window.localStorage.getItem(sideKey(roomId))
          return raw === "p1" || raw === "p2" ? raw : null
        } catch {
          // Private mode, or storage disabled. The side defaults to p1, which
          // is wrong half the time but never throws.
          return null
        }
      },
      setRoomSide: (roomId, side) => {
        try {
          window.localStorage.setItem(sideKey(roomId), side)
        } catch {
          /* non-fatal */
        }
      },
    }),
    [socket, status, connection, error, connect, disconnect],
  )

  return <PvpSocketContext.Provider value={value}>{children}</PvpSocketContext.Provider>
}
