// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { SocketConnectionState } from "@/stores/useSocketStore"

// Mock the env to avoid import errors
vi.mock("@/config/env.public", () => ({
  env: { NEXT_PUBLIC_SOCKET_URL: "http://localhost:3000" },
}))

// Mock the socket store
let mockConnectionState: SocketConnectionState = "offline"
let mockReconnectAttempt = 0

vi.mock("@/stores/useSocketStore", () => ({
  default: () => ({
    connectionState: mockConnectionState,
    reconnectAttempt: mockReconnectAttempt,
    socket: null,
  }),
}))

import { useSocketState } from "../useSocketState"
import { renderHook } from "@testing-library/react"

describe("useSocketState", () => {
  beforeEach(() => {
    mockConnectionState = "offline"
    mockReconnectAttempt = 0
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns connected state when socket is connected", () => {
    mockConnectionState = "connected"

    const { result } = renderHook(() => useSocketState())

    expect(result.current.state).toBe("connected")
    expect(result.current.isConnected).toBe(true)
    expect(result.current.isReconnecting).toBe(false)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.isFailed).toBe(false)
  })

  it("returns reconnecting state with attempt counter", () => {
    mockConnectionState = "reconnecting"
    mockReconnectAttempt = 2

    const { result } = renderHook(() => useSocketState())

    expect(result.current.state).toBe("reconnecting")
    expect(result.current.isReconnecting).toBe(true)
    expect(result.current.isConnected).toBe(false)
    expect(result.current.reconnectAttempt).toBe(2)
  })

  it("returns offline state", () => {
    mockConnectionState = "offline"

    const { result } = renderHook(() => useSocketState())

    expect(result.current.state).toBe("offline")
    expect(result.current.isOffline).toBe(true)
    expect(result.current.isConnected).toBe(false)
  })

  it("returns failed state", () => {
    mockConnectionState = "failed"

    const { result } = renderHook(() => useSocketState())

    expect(result.current.state).toBe("failed")
    expect(result.current.isFailed).toBe(true)
    expect(result.current.isConnected).toBe(false)
  })

  it("tracks state transitions", () => {
    const { result, rerender } = renderHook(() => useSocketState())

    expect(result.current.isConnected).toBe(false)

    mockConnectionState = "connected"
    rerender()
    expect(result.current.isConnected).toBe(true)

    mockConnectionState = "reconnecting"
    rerender()
    expect(result.current.isReconnecting).toBe(true)

    mockConnectionState = "offline"
    rerender()
    expect(result.current.isOffline).toBe(true)
  })
})
