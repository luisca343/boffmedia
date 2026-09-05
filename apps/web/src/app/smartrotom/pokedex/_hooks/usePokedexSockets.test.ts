import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { subscribePokedex } from "./usePokedexSockets"

const MINE = "uuid-me"
const SOMEONE_ELSE = "uuid-other"

describe("usePokedexSockets", () => {
  describe("subscribePokedex", () => {
    let socket: any
    let invalidate: (() => void) & ReturnType<typeof vi.fn>

    beforeEach(() => {
      socket = {
        on: vi.fn(),
        off: vi.fn(),
      }
      invalidate = vi.fn() as (() => void) & ReturnType<typeof vi.fn>
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it("should subscribe to pokedex:capture event", () => {
      subscribePokedex(socket, invalidate, MINE)

      expect(socket.on).toHaveBeenCalledWith(
        "pokedex:capture",
        expect.any(Function),
      )
    })

    it("should subscribe to pokedex:updated event", () => {
      subscribePokedex(socket, invalidate, MINE)

      expect(socket.on).toHaveBeenCalledWith(
        "pokedex:updated",
        expect.any(Function),
      )
    })

    it("should subscribe to connect event for reconnect handling", () => {
      subscribePokedex(socket, invalidate, MINE)

      expect(socket.on).toHaveBeenCalledWith("connect", expect.any(Function))
    })

    it("should call invalidate when pokedex:capture event fires", () => {
      subscribePokedex(socket, invalidate, MINE)

      // Get the handler for pokedex:capture
      const foundCall = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "pokedex:capture",
      )
      const [, handler] = foundCall as [string, (...args: any[]) => void]
      ;(handler as (...args: any[]) => void)({
        uuid: MINE,
        pokemonId: 25,
        form: "base",
      })

      expect(invalidate).toHaveBeenCalled()
    })

    it("should call invalidate when pokedex:updated event fires", () => {
      subscribePokedex(socket, invalidate, MINE)

      // Get the handler for pokedex:updated
      const foundCall = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "pokedex:updated",
      )
      const [, handler] = foundCall as [string, (...args: any[]) => void]
      ;(handler as (...args: any[]) => void)({ uuid: MINE })

      expect(invalidate).toHaveBeenCalled()
    })

    it("should call invalidate when connect event fires", () => {
      subscribePokedex(socket, invalidate, MINE)

      // Get the handler for connect
      const foundCall = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "connect",
      )
      const [, handler] = foundCall as [string, (...args: any[]) => void]
      ;(handler as (...args: any[]) => void)()

      expect(invalidate).toHaveBeenCalled()
    })

    it("should return an unsubscribe function that removes all listeners", () => {
      const unsubscribe = subscribePokedex(socket, invalidate, MINE)

      // Call invalidate to confirm it was set up
      const handlers = socket.on.mock.calls.map(
        (call: any[]) => call[1],
      )

      // Call unsubscribe
      unsubscribe()

      // Verify all handlers are unsubscribed
      expect(socket.off).toHaveBeenCalledTimes(3) // 3 events
      socket.off.mock.calls.forEach((call: any[]) => {
        const [event, handler] = call
        expect(["pokedex:capture", "pokedex:updated", "connect"]).toContain(
          event,
        )
        expect(typeof handler).toBe("function")
      })
    })

    it("ignores a capture belonging to another player", () => {
      // THE bug this guard exists for. The server used to `server.emit` to every
      // connected socket and this listener invalidated on any event, so one
      // player's capture made EVERY player refetch their whole Pokedex - a
      // storm scaling with players x captures, worse than the 30s TTL S1 set
      // out to fix. Delete the uuid check in subscribePokedex and this fails.
      subscribePokedex(socket, invalidate, MINE)

      const [, handler] = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "pokedex:capture",
      ) as [string, (...args: any[]) => void]
      handler({ uuid: SOMEONE_ELSE, pokemonId: 25, form: "base" })

      expect(invalidate).not.toHaveBeenCalled()
    })

    it("ignores an event with no uuid, since it cannot be attributed", () => {
      subscribePokedex(socket, invalidate, MINE)

      const [, handler] = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "pokedex:updated",
      ) as [string, (...args: any[]) => void]
      handler({})

      expect(invalidate).not.toHaveBeenCalled()
    })

    it("still refetches on connect regardless of uuid, to close the offline hole", () => {
      subscribePokedex(socket, invalidate, MINE)

      const [, handler] = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "connect",
      ) as [string, (...args: any[]) => void]
      handler()

      expect(invalidate).toHaveBeenCalledTimes(1)
    })

    it("should not call invalidate until an event fires", () => {
      subscribePokedex(socket, invalidate, MINE)

      expect(invalidate).not.toHaveBeenCalled()
    })

    it("should handle multiple invalidate calls from different events", () => {
      subscribePokedex(socket, invalidate, MINE)

      const captureCall = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "pokedex:capture",
      ) as [string, (...args: any[]) => void]
      const updateCall = socket.on.mock.calls.find(
        (call: any[]) => call[0] === "pokedex:updated",
      ) as [string, (...args: any[]) => void]

      const captureHandler = captureCall[1] as (...args: any[]) => void
      const updateHandler = updateCall[1] as (...args: any[]) => void

      captureHandler({ uuid: MINE, pokemonId: 25, form: "base" })
      updateHandler({ uuid: MINE })

      expect(invalidate).toHaveBeenCalledTimes(2)
    })
  })
})
