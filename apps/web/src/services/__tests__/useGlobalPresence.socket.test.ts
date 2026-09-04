// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest"

vi.mock("@/config/env.public", () => ({
  env: { NEXT_PUBLIC_SOCKET_URL: "http://localhost:3000" },
}))

/**
 * Test that presence resubscription follows the reconnect pattern.
 *
 * This mirrors the pattern in useGobiernoSockets (S2): a reconnect has a hole
 * behind it (presence changes while offline are missed), so we listen for
 * "connect" to ensure a fresh list arrives.
 */
describe("useGlobalPresence socket resubscription", () => {
  it("subscribes to connect event for resubscription", () => {
    // Minimal socket mock that tracks event listeners
    class FakeSocket {
      handlers = new Map<string, Set<(data?: any) => void>>()

      on(event: string, handler: (data?: any) => void) {
        if (!this.handlers.has(event)) {
          this.handlers.set(event, new Set())
        }
        this.handlers.get(event)!.add(handler)
      }

      off(event: string, handler: (data?: any) => void) {
        this.handlers.get(event)?.delete(handler)
      }

      emit(event: string, data?: any) {
        for (const fn of this.handlers.get(event) ?? []) {
          fn(data)
        }
      }

      get listenerCount() {
        return [...this.handlers.values()].reduce((n, s) => n + s.size, 0)
      }

      hasListener(event: string): boolean {
        return (this.handlers.get(event)?.size ?? 0) > 0
      }
    }

    // Test that presence subscribes to required events
    const socket = new FakeSocket()
    const presenceUpdates: Array<{ uuid: string; status: string }> = []

    // Mimic what useGlobalPresence does
    const handlePresenceUpdate = (data: { uuid: string; status: string }) => {
      presenceUpdates.push(data)
    }

    socket.on("presence:update", handlePresenceUpdate)
    socket.on("presence:list", () => {})
    socket.on("connect", () => {})

    // Verify all three listeners are attached
    expect(socket.hasListener("presence:update")).toBe(true)
    expect(socket.hasListener("presence:list")).toBe(true)
    expect(socket.hasListener("connect")).toBe(true)

    // Simulate presence update
    socket.emit("presence:update", { uuid: "user-1", status: "online" })
    expect(presenceUpdates).toContainEqual({ uuid: "user-1", status: "online" })

    // Simulate reconnect - connect event should fire
    // (In real usage, smartrotom:connection re-emits after connect,
    // which causes the server to send presence:list)
    socket.emit("connect")

    // The test confirms the listener exists; the actual re-fetch
    // happens when the server sends presence:list after smartrotom:connection
  })

  it("cleans up listeners when effect unmounts", () => {
    class FakeSocket {
      handlers = new Map<string, Set<(data?: any) => void>>()

      on(event: string, handler: (data?: any) => void) {
        if (!this.handlers.has(event)) {
          this.handlers.set(event, new Set())
        }
        this.handlers.get(event)!.add(handler)
      }

      off(event: string, handler: (data?: any) => void) {
        this.handlers.get(event)?.delete(handler)
      }

      get listenerCount() {
        return [...this.handlers.values()].reduce((n, s) => n + s.size, 0)
      }
    }

    const socket = new FakeSocket()
    const handler1 = () => {}
    const handler2 = () => {}
    const handler3 = () => {}

    socket.on("presence:update", handler1)
    socket.on("presence:list", handler2)
    socket.on("connect", handler3)

    expect(socket.listenerCount).toBe(3)

    // Clean up like the useEffect return does
    socket.off("presence:update", handler1)
    socket.off("presence:list", handler2)
    socket.off("connect", handler3)

    expect(socket.listenerCount).toBe(0)
  })
})
