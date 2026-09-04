"use client"

/**
 * The one PvP socket, and the one owner of everything that arrives on it.
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
 * AND THE LISTENERS COME WITH IT. Every battle frame is subscribed HERE, once
 * per socket instance, and routed into `PvpInbox` by room. The room screen used
 * to attach its own handlers in an effect that listed the provider's context
 * value in its dependencies — so a transport status flicker re-ran it, which
 * re-emitted `spectate` and re-applied the replay onto a populated battle. The
 * screen now adopts a session and reads an inbox; it never touches the socket's
 * event surface. See `pvpInbox.ts` for what the routing guarantees.
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
import { PvpInbox, type PvpInboxSession, type PvpRoomInbox, type PvpSide } from "./pvpInbox"

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

/** The stable half of the API: never changes identity, safe in effect deps. */
export interface PvpSocketActions {
  connect(): Promise<Socket | null>
  disconnect(): void
  /** The live session for a room, handed from the lobby to the room screen. */
  getRoomSession(roomId: string): BattleSession | null
  setRoomSession(roomId: string, session: BattleSession | null): void
  /**
   * Which side you play in a room, as the SERVER last stated it — falling back
   * to the stored hint only until it does. See {@link PvpRoomInbox.side}.
   */
  getRoomSide(roomId: string): PvpSide | null
  setRoomSide(roomId: string, side: PvpSide): void
  /** Everything known about a room's stream. Null if nothing has arrived. */
  getRoom(roomId: string): PvpRoomInbox | null
  /** Adopt a session for a room: buffered frames and any held log are applied. */
  attachSession(roomId: string, session: PvpInboxSession): void
  /** Enter a room's stream (`resume` when a side is known, else `spectate`). */
  joinRoom(roomId: string, sideHint?: PvpSide | null): void
  /** Re-render when anything about a room changes. Returns the unsubscriber. */
  subscribeRoom(roomId: string, listener: () => void): () => void
}

export interface PvpSocketApi extends PvpSocketActions {
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
}

const PvpActionsContext = React.createContext<PvpSocketActions | null>(null)
const PvpStatusContext = React.createContext<{
  socket: Socket | null
  status: PvpTransportStatus
  connection: PvpConnection
  error: string | null
} | null>(null)

/**
 * The actions only.
 *
 * Use this wherever the value goes into an effect's dependency list: it is
 * created once and never replaced, so an effect that keys on it plus a room id
 * runs exactly when the room changes — which is what stopped the room screen
 * re-joining its own battle on every reconnect flicker.
 */
export function usePvpActions(): PvpSocketActions {
  const api = React.useContext(PvpActionsContext)
  if (!api) throw new Error("usePvpActions must be used inside <PvpSocketProvider>")
  return api
}

/**
 * The transport half only: the socket, its status, and `connect`.
 *
 * Changes identity when the connection does, which is exactly what a banner
 * wants and exactly what a join effect must not depend on.
 */
export function usePvpTransport(): {
  socket: Socket | null
  status: PvpTransportStatus
  connection: PvpConnection
  error: string | null
  connect(): Promise<Socket | null>
} {
  const actions = usePvpActions()
  const status = React.useContext(PvpStatusContext)
  if (!status) throw new Error("usePvpTransport must be used inside <PvpSocketProvider>")
  return React.useMemo(
    () => ({ ...status, connect: actions.connect }),
    [status, actions],
  )
}

export function usePvpSocket(): PvpSocketApi {
  const actions = usePvpActions()
  const status = React.useContext(PvpStatusContext)
  if (!status) throw new Error("usePvpSocket must be used inside <PvpSocketProvider>")
  return React.useMemo<PvpSocketApi>(
    () => ({ ...actions, ...status, opponentConnected: true }),
    [actions, status],
  )
}

/**
 * How long a socket that has NEVER connected may keep saying "connecting".
 *
 * socket.io's `reconnectionAttempts` defaults to Infinity, so `reconnect_failed`
 * never fires and `socket.active` is never false — which meant a first
 * connection that could not be made reported nothing at all: `connect_error`
 * set the banner to "reconnecting" and left `status` on `connecting` for the
 * rest of the page's life, with no error, no retry and no explanation.
 *
 * The retrying is right; the silence was not. This clock only changes what the
 * screen SAYS. The socket keeps trying underneath, so a connection that comes
 * good on the ninth attempt still recovers the lobby on its own.
 */
const FIRST_CONNECT_DEADLINE_MS = 15_000

/** Namespaced so it cannot collide with another tool's keys in the same origin. */
const sideKey = (roomId: string) => `bsim.pvp.side.${roomId}`

function readStoredSide(roomId: string): PvpSide | null {
  try {
    const raw = window.localStorage.getItem(sideKey(roomId))
    return raw === "p1" || raw === "p2" ? raw : null
  } catch {
    // Private mode, or storage disabled. A missing hint is fine: the server
    // states the side on `resumed` / `spectateJoined`, and that is the only
    // value the engine is ever given.
    return null
  }
}

export function PvpSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = React.useRef<Socket | null>(null)
  // One in-flight open at a time: the lobby's effect and a `joinQueue` can both
  // ask before the first ticket has come back, and two sockets means two
  // identities on the same account.
  const pendingRef = React.useRef<Promise<Socket | null> | null>(null)
  const detachRef = React.useRef<(() => void) | null>(null)
  const sessionsRef = React.useRef(new Map<string, BattleSession>())
  const inboxRef = React.useRef<PvpInbox>(new PvpInbox(null))
  /**
   * Which socket instance already carries our listeners.
   *
   * StrictMode double-invokes effects and `connect()` can be called from three
   * screens; subscribing twice to the same socket applies every frame twice,
   * which on a sequenced stream shows up as "nothing happens" rather than as a
   * duplicate, because `acceptFrame` drops the second copy and the counters
   * silently disagree. One instance, one subscription.
   */
  const subscribedTo = React.useRef<Socket | null>(null)
  /** Whether this socket has ever been connected — a second one is a RECONNECT. */
  const hasConnectedRef = React.useRef(false)
  /** Fires if the FIRST connection never lands. See `FIRST_CONNECT_DEADLINE_MS`. */
  const deadlineRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearDeadline = React.useCallback(() => {
    if (deadlineRef.current !== null) {
      clearTimeout(deadlineRef.current)
      deadlineRef.current = null
    }
  }, [])

  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [status, setStatus] = React.useState<PvpTransportStatus>("idle")
  const [connection, setConnection] = React.useState<PvpConnection>("connected")
  const [error, setError] = React.useState<string | null>(null)

  /**
   * Every battle frame, subscribed once per socket, routed by room.
   *
   * The listener set is deliberately the WHOLE server vocabulary for a battle
   * (minus matchmaking, which `usePvPMatchmaking` owns): a screen that only
   * subscribes while it is mounted cannot receive the opening request, and that
   * was C3.
   */
  const subscribe = React.useCallback((next: Socket) => {
    if (subscribedTo.current === next) return
    const inbox = inboxRef.current
    inbox.setTransport(next)

    const onProtocol = (data: any) => inbox.handleProtocol(data)
    const onBattleEnd = (data: any) => inbox.handleBattleEnd(data)
    const onResumed = (data: any) => inbox.handleResumed(data, "resumed")
    const onSpectateJoined = (data: any) => inbox.handleResumed(data, "spectateJoined")
    const onChat = (data: any) => inbox.handleChat(data)
    const onTimer = (data: any) => inbox.handleTimer(data)
    const onError = (data: any) => inbox.handleError(data ?? {})
    const onBattleCreated = (data: any) => {
      if (!data?.roomId) return
      const room = inbox.room(data.roomId)
      if (data.side === "p1" || data.side === "p2") room.side = data.side
      if (data.format) room.format = data.format
    }
    // A `connect` that is not the FIRST is a reconnect: the gateway forgot us
    // (a new socket id), the grace timer is running on every room we play, and
    // whatever arrived while we were away exists only in the room's log.
    const onReconnected = () => {
      if (hasConnectedRef.current) inbox.resumeAll()
      hasConnectedRef.current = true
    }

    next.on("protocol", onProtocol)
    next.on("battleEnd", onBattleEnd)
    next.on("resumed", onResumed)
    next.on("spectateJoined", onSpectateJoined)
    next.on("chatMessage", onChat)
    next.on("timerUpdate", onTimer)
    next.on("error", onError)
    next.on("battleCreated", onBattleCreated)
    next.on("connect", onReconnected)
    if (next.connected) hasConnectedRef.current = true

    subscribedTo.current = next
    return () => {
      next.off("protocol", onProtocol)
      next.off("battleEnd", onBattleEnd)
      next.off("resumed", onResumed)
      next.off("spectateJoined", onSpectateJoined)
      next.off("chatMessage", onChat)
      next.off("timerUpdate", onTimer)
      next.off("error", onError)
      next.off("battleCreated", onBattleCreated)
      next.off("connect", onReconnected)
      if (subscribedTo.current === next) subscribedTo.current = null
    }
  }, [])

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
      } catch (e) {
        // We know there IS a session by here, so this is the API or the
        // network — never a missing account.
        console.warn("[battlesim] could not open the PvP socket", e)
        setStatus("error")
        setError("connect_failed")
        setConnection("lost")
        return null
      }

      socketRef.current = next

      const onConnect = () => {
        clearDeadline()
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

      // Armed only for the FIRST connection. Once `onConnect` has run this is
      // cleared and never re-armed: a socket that drops mid-battle is a
      // reconnect, and reporting that as a fatal error would replace a battle
      // that is about to come back with an error page.
      clearDeadline()
      if (!next.connected) {
        deadlineRef.current = setTimeout(() => {
          deadlineRef.current = null
          if (next.connected || socketRef.current !== next) return
          setStatus("error")
          setError("connect_failed")
          setConnection("lost")
        }, FIRST_CONNECT_DEADLINE_MS)
      }

      const detachBattle = subscribe(next)

      detachRef.current = () => {
        clearDeadline()
        next.off("connect", onConnect)
        next.off("disconnect", onDisconnect)
        next.off("connect_error", onConnectError)
        next.io.off("reconnect", onConnect)
        next.io.off("reconnect_failed", onReconnectFailed)
        detachBattle?.()
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
  }, [subscribe, clearDeadline])

  const disconnect = React.useCallback(() => {
    clearDeadline()
    detachRef.current?.()
    detachRef.current = null
    socketRef.current?.close()
    socketRef.current = null
    pendingRef.current = null
    subscribedTo.current = null
    hasConnectedRef.current = false
    sessionsRef.current.clear()
    inboxRef.current.clear()
    inboxRef.current.setTransport(null)
    setSocket(null)
    setStatus("idle")
    setConnection("connected")
    setError(null)
  }, [clearDeadline])

  React.useEffect(() => {
    const inbox = inboxRef.current
    return () => {
      detachRef.current?.()
      socketRef.current?.close()
      socketRef.current = null
      subscribedTo.current = null
      inbox.clear()
    }
  }, [])

  /**
   * Built ONCE and never replaced.
   *
   * Every function closes over a ref, so none of them has a reason to change
   * when the transport's status does — which is the whole point: a room screen
   * lists these in its effect dependencies and must not re-run its join when a
   * reconnect banner appears.
   */
  const actions = React.useMemo<PvpSocketActions>(
    () => ({
      connect,
      disconnect,
      getRoomSession: (roomId) => sessionsRef.current.get(roomId) ?? null,
      setRoomSession: (roomId, session) => {
        if (session) sessionsRef.current.set(roomId, session)
        else sessionsRef.current.delete(roomId)
      },
      getRoomSide: (roomId) => inboxRef.current.peek(roomId)?.side ?? readStoredSide(roomId),
      setRoomSide: (roomId, side) => {
        inboxRef.current.room(roomId).side = side
        try {
          window.localStorage.setItem(sideKey(roomId), side)
        } catch {
          /* non-fatal: the server restates the side on every resume */
        }
      },
      getRoom: (roomId) => inboxRef.current.peek(roomId),
      attachSession: (roomId, session) => {
        inboxRef.current.attachSession(roomId, session)
      },
      joinRoom: (roomId, sideHint) => {
        inboxRef.current.join(roomId, sideHint ?? readStoredSide(roomId))
      },
      subscribeRoom: (roomId, listener) => inboxRef.current.subscribe(roomId, listener),
    }),
    [connect, disconnect],
  )

  const transport = React.useMemo(
    () => ({ socket, status, connection, error }),
    [socket, status, connection, error],
  )

  return (
    <PvpActionsContext.Provider value={actions}>
      <PvpStatusContext.Provider value={transport}>{children}</PvpStatusContext.Provider>
    </PvpActionsContext.Provider>
  )
}
