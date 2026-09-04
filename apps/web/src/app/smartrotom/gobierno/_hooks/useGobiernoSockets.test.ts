import { describe, it, expect, vi } from "vitest"

// `./queries` reaches the env schema at import time, which is not this file's
// concern: only distinct key arrays matter here.
vi.mock("./queries", () => ({
  gobKeys: {
    denuncias: () => ["gob", "denuncias", {}],
    expedientes: () => ["gob", "expedientes", {}],
    multas: () => ["gob", "multas", {}],
    apelaciones: () => ["gob", "apelaciones", {}],
  },
}))

// The hook half of this module pulls in the socket store, which also reaches
// the env schema. Only the subscription table is under test here.
vi.mock("@/stores/useSocketStore", () => ({ default: () => ({ socket: null }) }))

import { subscribeGobierno } from "./useGobiernoSockets"

class FakeSocket {
  handlers = new Map<string, Set<() => void>>()
  on(event: string, fn: () => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(fn)
  }
  off(event: string, fn: () => void) {
    this.handlers.get(event)?.delete(fn)
  }
  emit(event: string) {
    for (const fn of this.handlers.get(event) ?? []) fn()
  }
  get listenerCount() {
    return [...this.handlers.values()].reduce((n, s) => n + s.size, 0)
  }
}

function wired() {
  const socket = new FakeSocket()
  const invalidated: string[] = []
  const stop = subscribeGobierno(socket, (key) => invalidated.push((key as string[])[1]))
  return { socket, invalidated, stop }
}

describe("subscribeGobierno", () => {
  it("invalidates the list each event belongs to", () => {
    const { socket, invalidated } = wired()

    socket.emit("gobierno:denuncia:created")
    socket.emit("gobierno:expediente:evento")
    socket.emit("gobierno:multa:created")

    expect(invalidated).toEqual(["denuncias", "expedientes", "multas"])
  })

  it("touches appeals as well when a fine changes status", () => {
    const { socket, invalidated } = wired()
    socket.emit("gobierno:multa:status_changed")
    expect(invalidated).toEqual(["multas", "apelaciones"])
  })

  // A reconnect has a hole behind it: whatever was emitted while the tab was
  // offline is gone for good, so a targeted invalidation would leave the staff
  // list confidently stale — the exact failure S2 is about.
  it("refetches everything on reconnect", () => {
    const { socket, invalidated } = wired()
    socket.emit("connect")
    expect(invalidated).toEqual(["denuncias", "expedientes", "multas", "apelaciones"])
  })

  it("removes every listener it added", () => {
    const { socket, stop } = wired()
    expect(socket.listenerCount).toBe(7)

    stop()
    expect(socket.listenerCount).toBe(0)

    socket.emit("gobierno:denuncia:created")
  })
})
