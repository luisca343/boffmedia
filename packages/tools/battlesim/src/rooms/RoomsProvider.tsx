"use client"

/**
 * The open-room registry: what the global tab bar shows, and what keeps a
 * battle alive while you are looking at something else.
 *
 * WHY IT EXISTS. `BsimRoot` used to render exactly one screen per `nav.screen`,
 * so every navigation was an unmount. A local AI battle is a Web Worker plus a
 * `BattleSession` owned by `PlayView`, so "go and look at your teams" and
 * "throw away the battle you are in the middle of" were the same gesture. The
 * PvP room had already worked around a smaller version of this by parking its
 * session in `PvpSocketProvider` — a registry mounted ABOVE the switch. This is
 * the same move, generalised: rooms are declared here, every open one is
 * RENDERED at once (only the active one is visible), and the screen switch
 * below is reduced to the screens that are not rooms.
 *
 * NAV IS STILL THE SOURCE OF TRUTH. `activeRoomId` is not state — it is derived
 * from the address on every render. Activating a tab performs a `nav.replace`
 * and the derived value follows, which is what keeps deep links, browser Back
 * and the launcher's in-memory stack all working with one code path. The
 * reverse direction is an effect: arriving at a room address that is not in the
 * registry OPENS it, so `/pokemon/battlesim/pvp/battle/<id>` pasted into a
 * fresh tab produces the tab it should have.
 *
 * WHAT A ROOM IS NOT. A room is not a promise of persistence. A local battle is
 * simulated in a worker in this document: it cannot survive a reload or leaving
 * the tool, and this provider does not pretend otherwise — it installs the
 * `beforeunload` guard for exactly that reason, and the tab bar confirms before
 * closing a running one.
 */

import * as React from "react"

import { useBsimNav, type BsimNav, type BsimScreen } from "../nav"
import { useLocalBattleEngine, type LocalBattleEngine } from "../play/useLocalBattle"
import { BSIM_FORMATS } from "../lib/bsim-data"

/* ── The record ──────────────────────────────────────────────────────────── */

/** Where a room's protocol lines come from. Decides which screen renders it. */
export type BsimRoomKind = "ai" | "pvp" | "showdown" | "replay"

/** The tab dot. Same four values `BattleTabItem` used, so nothing re-learns them. */
export type BsimRoomTone = "ok" | "warn" | "bad" | "dim"

export interface BsimRoom {
  /** Unique across kinds — a PvP room and a replay may share a raw id. */
  id: string
  kind: BsimRoomKind
  /** The tab's word. Renameable, because the format only arrives with the battle. */
  label: string
  /** The tab's second line: a short room id, a format. */
  sub?: string
  tone: BsimRoomTone
  /** What renders it, and with which address. This IS the room's deep link. */
  screen: BsimScreen
  params: Record<string, string>
}

/** A short, stable handle for a uuid or an integer id. */
export function shortRoomId(raw: string): string {
  return raw.length > 8 ? raw.slice(0, 8) : raw
}

/**
 * The address → room mapping, in ONE place.
 *
 * Both directions read it: the effect below turns an arriving address into a
 * tab, and `activateRoom` turns a tab back into an address. A second copy of
 * this table is how a tab and its URL drift apart.
 *
 * The param names are the nav seam's own vocabulary (`roomId`, `id`, `source`)
 * — nothing new is invented here. `play` gains a `roomId` it did not carry
 * before, which is what makes "which local battle am I looking at" a place
 * rather than component state.
 */
export function roomKeyFor(screen: BsimScreen, params: Record<string, string>): { id: string; kind: BsimRoomKind; raw: string } | null {
  switch (screen) {
    case "play":
      return params.roomId ? { id: params.roomId, kind: "ai", raw: params.roomId } : null
    case "pvpRoom":
      return params.roomId ? { id: `pvp:${params.roomId}`, kind: "pvp", raw: params.roomId } : null
    case "showdownRoom":
      return params.roomId ? { id: `sd:${params.roomId}`, kind: "showdown", raw: params.roomId } : null
    case "replayDetail":
      return params.id ? { id: `replay:${params.id}`, kind: "replay", raw: params.id } : null
    default:
      return null
  }
}

/** The room an address describes, or null when the address is not a room. */
function roomFromNav(screen: BsimScreen, params: Record<string, string>): BsimRoom | null {
  const key = roomKeyFor(screen, params)
  if (!key) return null
  const roomParams: Record<string, string> =
    key.kind === "replay"
      ? { id: key.raw, ...(params.source ? { source: params.source } : {}) }
      : { roomId: key.raw }
  return {
    id: key.id,
    kind: key.kind,
    // Deliberately empty: the tab bar owns the fallback wording, because only
    // it has the catalog. A room opened by `createBattle` arrives with a real
    // one (the format) and keeps it.
    label: "",
    sub: shortRoomId(key.raw),
    tone: "dim",
    screen,
    params: roomParams,
  }
}

/* ── The context ─────────────────────────────────────────────────────────── */

export interface BsimRoomsApi {
  /** Tab order. Newest last, as a browser does it. */
  rooms: BsimRoom[]
  /** Derived from the address, never stored. Null on the hub and the lobbies. */
  activeRoomId: string | null
  /** Add (or refresh) a room. Does not navigate — `activateRoom` does. */
  openRoom(room: BsimRoom): void
  /**
   * Destroy it. A local battle's session and, if it was the last, the worker.
   * `silent` skips the follow-on navigation, for a caller that is about to
   * navigate somewhere better itself (a rematch closing the room it replaces).
   */
  closeRoom(id: string, opts?: { silent?: boolean }): void
  /** Navigate to the room's own address. */
  activateRoom(id: string): void
  renameRoom(id: string, label: string, sub?: string): void
  /** For the state dot on non-local rooms; local ones read their session. */
  setRoomTone(id: string, tone: BsimRoomTone): void
  /** The lifted local-battle engine. Local battles keep simulating while hidden. */
  local: LocalBattleEngine
  /** Whether a local battle is mid-turn — the close confirm and the unload guard. */
  isRoomLive(id: string): boolean
}

const RoomsContext = React.createContext<BsimRoomsApi | null>(null)

export function useBsimRooms(): BsimRoomsApi {
  const api = React.useContext(RoomsContext)
  if (!api) throw new Error("useBsimRooms must be used inside <RoomsProvider>")
  return api
}

/**
 * {@link useBsimRooms} for the components that can legitimately render outside
 * the tool — the replay player is embedded in a SmartRotom modal with no rooms
 * seam around it, and must not throw for want of one.
 */
export function useBsimRoomsMaybe(): BsimRoomsApi | null {
  return React.useContext(RoomsContext)
}

/* ── The provider ────────────────────────────────────────────────────────── */

export function RoomsProvider({ children }: { children: React.ReactNode }) {
  const nav = useBsimNav()
  const local = useLocalBattleEngine()
  const [rooms, setRooms] = React.useState<BsimRoom[]>([])
  // Read inside callbacks that must not re-create themselves whenever the list
  // changes — `closeRoom` in particular is handed to the tab bar's dialog.
  const roomsRef = React.useRef(rooms)
  roomsRef.current = rooms

  // Not state. The address already answers "which room am I in", and a second
  // copy of that answer is a second thing to keep in sync with Back.
  const fromNav = roomFromNav(nav.screen, nav.params)
  const activeRoomId = fromNav?.id ?? null

  // `nav` is rebuilt on every render of the web host (its `params` bag is a
  // fresh object each time), so the effect keys off the VALUES, never the nav
  // object — otherwise this runs on every keystroke anywhere in the tool.
  const navScreen = nav.screen
  const navRoomId = nav.params.roomId
  const navId = nav.params.id
  const navSource = nav.params.source

  /** An address that names a room opens it. This is the deep-link half. */
  React.useEffect(() => {
    const room = roomFromNav(navScreen, { roomId: navRoomId, id: navId, source: navSource } as Record<string, string>)
    if (!room) return
    setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [...prev, room]))
  }, [navScreen, navRoomId, navId, navSource])

  /**
   * A local battle whose session is gone loses its tab.
   *
   * Two ways that happens and neither goes through `closeRoom`: a hot reload
   * dropped the worker, or the address carried a `roomId` from a previous page
   * load. Without this the bar shows a tab that can only ever render the setup
   * screen.
   */
  const sessions = local.sessions
  React.useEffect(() => {
    const stale = roomsRef.current.filter((r) => r.kind === "ai" && !sessions.has(r.id))
    if (stale.length === 0) return
    setRooms((prev) => prev.filter((r) => !stale.some((s) => s.id === r.id)))
    // Standing on the tab that just evaporated is the one case that cannot be
    // left alone: `BsimShell` shows the base layer when no OPEN room matches
    // the address, but the address would still claim a room. Send it to the
    // setup screen, which is what "that battle is not here any more" means.
    if (stale.some((s) => s.id === roomFromNav(navScreen, { roomId: navRoomId ?? "" })?.id)) nav.replace("play", {})
  }, [sessions, rooms.length, navScreen, navRoomId, nav.replace])

  const openRoom = React.useCallback((room: BsimRoom) => {
    setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev.map((r) => (r.id === room.id ? { ...r, ...room } : r)) : [...prev, room]))
  }, [])

  const renameRoom = React.useCallback((id: string, label: string, sub?: string) => {
    setRooms((prev) => {
      const at = prev.find((r) => r.id === id)
      if (!at || (at.label === label && (sub === undefined || at.sub === sub))) return prev
      return prev.map((r) => (r.id === id ? { ...r, label, ...(sub === undefined ? {} : { sub }) } : r))
    })
  }, [])

  const setRoomTone = React.useCallback((id: string, tone: BsimRoomTone) => {
    setRooms((prev) => {
      const at = prev.find((r) => r.id === id)
      if (!at || at.tone === tone) return prev
      return prev.map((r) => (r.id === id ? { ...r, tone } : r))
    })
  }, [])

  const activateRoom = React.useCallback(
    (id: string) => {
      const room = roomsRef.current.find((r) => r.id === id)
      if (!room) return
      nav.replace(room.screen, room.params)
    },
    // `nav` is a new object every render on the web host; only `replace` is
    // read, and it closes over the router, which is stable.
    [nav.replace],
  )

  const closeBattle = local.closeBattle
  const closeRoom = React.useCallback(
    (id: string, opts?: { silent?: boolean }) => {
      const list = roomsRef.current
      const at = list.findIndex((r) => r.id === id)
      if (at === -1) return
      const room = list[at]
      if (room.kind === "ai") closeBattle(room.id)
      setRooms((prev) => prev.filter((r) => r.id !== id))
      if (opts?.silent) return
      // Only move if we were LOOKING at it: closing a background tab must not
      // navigate, or the tab bar becomes a way to lose your place.
      if (roomFromNav(nav.screen, nav.params)?.id !== id) return
      const next = list[at + 1] ?? list[at - 1]
      if (next) nav.replace(next.screen, next.params)
      else nav.replace("hub", { tab: "lobby" })
    },
    [closeBattle, nav.replace, nav.screen, nav.params.roomId, nav.params.id],
  )

  const isRoomLive = React.useCallback(
    (id: string) => {
      const room = roomsRef.current.find((r) => r.id === id)
      if (!room || room.kind !== "ai") return false
      const state = local.getSession(room.id)?.getState()
      return !!state && state.status === "active" && !state.battleComplete
    },
    [local],
  )

  /**
   * The unload guard, LIFTED for the same reason the engine was.
   *
   * `LiveBattle` installs one too, and deliberately keeps it: it covers the PvP
   * and Showdown rooms, whose sessions this provider knows nothing about. What
   * it cannot cover any more is a local battle running in a tab you are not
   * looking at — the component holding that listener is `visibility:hidden`,
   * but a reload would still kill the simulation. Two listeners produce one
   * browser prompt, so the overlap costs nothing.
   */
  const liveCount = React.useMemo(() => {
    let n = 0
    for (const session of sessions.values()) {
      const state = session.getState()
      if (state.status === "active" && !state.battleComplete) n += 1
    }
    return n
    // `sessions` is a stable Map mutated in place; `rooms` changing is the
    // cheapest signal that its contents moved.
  }, [sessions, rooms])

  React.useEffect(() => {
    if (liveCount === 0 || typeof window === "undefined") return
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onUnload)
    return () => window.removeEventListener("beforeunload", onUnload)
  }, [liveCount])

  const value = React.useMemo<BsimRoomsApi>(
    () => ({ rooms, activeRoomId, openRoom, closeRoom, activateRoom, renameRoom, setRoomTone, local, isRoomLive }),
    [rooms, activeRoomId, openRoom, closeRoom, activateRoom, renameRoom, setRoomTone, local, isRoomLive],
  )

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
}

/* ── Helpers the play screen and the tab bar share ───────────────────────── */

/** The format's display name, for a tab label and the battle bar alike. */
export function formatLabelFor(format: string | undefined): string | undefined {
  return format ? BSIM_FORMATS.find((f) => f.value === format)?.label : undefined
}

/** A nav whose screen/params are pinned to one room, for a layer that is not the address. */
export function navForRoom(nav: BsimNav, screen: BsimScreen, params: Record<string, string>): BsimNav {
  return { ...nav, screen, params }
}
