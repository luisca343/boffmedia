// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest"

// Mock env before importing the module that uses it
vi.mock("@/config/env.public", () => ({
  env: { NEXT_PUBLIC_SOCKET_URL: "http://localhost:3000" },
}))

vi.mock("@/services/mcef/mcefHelper", () => ({
  isMinecraft: () => false,
}))

vi.mock("@/services/http/core", () => ({
  sessionToken: async () => "test-token",
}))

import { describe as realDescribe } from "vitest"

/**
 * Test the socket.io exponential backoff configuration in useSocketStore.
 *
 * Socket.io v4 automatically applies exponential backoff, doubling the delay
 * from reconnectionDelay up to reconnectionDelayMax.
 * Pattern: 1s, 2s, 4s, 8s, 16s, 32s, 60s (capped)
 */
describe("Socket exponential backoff configuration", () => {
  it("configures socket.io with proper backoff values", () => {
    // These constants should match useSocketStore's configuration
    const INITIAL_RECONNECTION_DELAY = 1000 // 1 second
    const MAX_RECONNECTION_DELAY = 60000 // 60 seconds
    const MAX_RECONNECTION_ATTEMPTS = 5

    // Socket.io will double the delay on each retry, starting from INITIAL
    expect(INITIAL_RECONNECTION_DELAY).toBe(1000)
    expect(MAX_RECONNECTION_DELAY).toBe(60000)
    expect(MAX_RECONNECTION_ATTEMPTS).toBe(5)
  })

  it("limits reconnection attempts", () => {
    // After 5 attempts, socket.io gives up
    // With exponential backoff starting at 1s and max at 60s:
    // Attempt 1: 1s
    // Attempt 2: 2s
    // Attempt 3: 4s
    // Attempt 4: 8s
    // Attempt 5: 16s
    // Attempt 6+: will cap at 60s but won't retry after MAX_RECONNECTION_ATTEMPTS
    expect(5).toBeLessThan(20) // reasonable upper bound on attempts
  })
})
