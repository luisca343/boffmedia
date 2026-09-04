// @vitest-environment happy-dom
//
// This app's vitest runs in `node` by default; rendering a hook needs a DOM.
// happy-dom, not jsdom: the hoisted jsdom in this workspace pulls
// html-encoding-sniffer -> the ESM-only @exodus/bytes and throws ERR_REQUIRE_ESM.

import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useGlobalPresence } from "./useGlobalPresence"

/**
 * These drive the hook through the SOCKET EVENTS the server really sends.
 *
 * The first version of this file assigned to `result.current.onlineUsers`
 * directly, which does nothing to React state and never involved the socket at
 * all — the assertions passed or failed for reasons unrelated to the hook.
 * Here the mocked socket records its handlers so a test can deliver a real
 * `presence:list` / `presence:update` payload.
 */

const handlers = new Map<string, (payload: unknown) => void>()

const socket = {
  on: vi.fn((event: string, fn: (payload: unknown) => void) => {
    handlers.set(event, fn)
  }),
  off: vi.fn((event: string) => {
    handlers.delete(event)
  }),
}

vi.mock("./useSocket", () => ({
  useSocket: () => ({ socket }),
}))

/** Deliver a server event to whatever the hook subscribed. */
const emit = (event: string, payload: unknown) => {
  const handler = handlers.get(event)
  if (!handler) throw new Error(`nothing is listening for ${event}`)
  act(() => handler(payload))
}

beforeEach(() => {
  handlers.clear()
  vi.clearAllMocks()
})

describe("useGlobalPresence", () => {
  it("starts empty and treats an unknown player as offline", () => {
    const { result } = renderHook(() => useGlobalPresence())

    expect(result.current.onlineUsers.size).toBe(0)
    expect(result.current.getStatus("any-uuid")).toBe("offline")
    expect(result.current.isOnline("any-uuid")).toBe(false)
  })

  it("subscribes to both presence events", () => {
    renderHook(() => useGlobalPresence())

    expect(handlers.has("presence:list")).toBe(true)
    expect(handlers.has("presence:update")).toBe(true)
  })

  it("fills the list from presence:list on connection", () => {
    const { result } = renderHook(() => useGlobalPresence())

    emit("presence:list", [
      { uuid: "player-1", status: "online" },
      { uuid: "player-2", status: "ingame" },
    ])

    expect(result.current.isOnline("player-1")).toBe(true)
    expect(result.current.getStatus("player-2")).toBe("ingame")
    expect(result.current.isOnline("player-3")).toBe(false)
  })

  it("drops a player from the list when they go offline", () => {
    const { result } = renderHook(() => useGlobalPresence())

    emit("presence:list", [{ uuid: "player-1", status: "online" }])
    emit("presence:update", { uuid: "player-1", status: "offline" })

    expect(result.current.isOnline("player-1")).toBe(false)
    expect(result.current.getStatus("player-1")).toBe("offline")
    // Gone, not merely marked: a stale name in a "who is around" list is worse
    // than an absent one.
    expect(result.current.onlineUsers.size).toBe(0)
  })

  it("moves a player from online to ingame without losing them", () => {
    const { result } = renderHook(() => useGlobalPresence())

    emit("presence:list", [{ uuid: "player-1", status: "online" }])
    emit("presence:update", { uuid: "player-1", status: "ingame" })

    expect(result.current.getStatus("player-1")).toBe("ingame")
    expect(result.current.onlineUsers.size).toBe(1)
  })

  it("adds someone who appears only in an update", () => {
    const { result } = renderHook(() => useGlobalPresence())

    emit("presence:update", { uuid: "late-arrival", status: "online" })

    expect(result.current.isOnline("late-arrival")).toBe(true)
  })

  it("unsubscribes on unmount so a dead component stops updating", () => {
    const { unmount } = renderHook(() => useGlobalPresence())
    unmount()

    expect(handlers.has("presence:list")).toBe(false)
    expect(handlers.has("presence:update")).toBe(false)
  })
})
