// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useAuthThrottle } from "./useAuthThrottle"

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, number>) => {
    if (key === "message") return `Too many attempts. Please try again in ${vars?.seconds} seconds.`
    if (key === "button") return `Try again in ${vars?.seconds}s`
    return key
  },
}))

describe("useAuthThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it("initializes with no throttle", () => {
    const { result } = renderHook(() => useAuthThrottle())

    expect(result.current.isThrottled).toBe(false)
    expect(result.current.secondsRemaining).toBe(0)
  })

  it("sets throttle state when handleThrottle is called", () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any, 30)
    })

    expect(result.current.isThrottled).toBe(true)
    expect(result.current.secondsRemaining).toBeGreaterThan(0)
  })

  it("counts down seconds remaining", async () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any, 5)
    })

    expect(result.current.secondsRemaining).toBe(5)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.secondsRemaining).toBe(4)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(result.current.secondsRemaining).toBe(0)
    expect(result.current.isThrottled).toBe(false)
  })

  it("resets throttle state when reset is called", () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any, 30)
    })

    expect(result.current.isThrottled).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.isThrottled).toBe(false)
    expect(result.current.secondsRemaining).toBe(0)
  })

  it("generates appropriate button label with countdown", () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any, 10)
    })

    // Should include the seconds in the button label
    expect(result.current.buttonLabel).toContain("10")
  })

  it("extracts retry_after from response body if present", () => {
    const { result } = renderHook(() => useAuthThrottle())

    const responseWithRetryAfter = {
      statusCode: 429,
      retry_after: 45,
    } as any

    act(() => {
      result.current.handleThrottle(responseWithRetryAfter)
    })

    expect(result.current.secondsRemaining).toBe(45)
  })

  it("uses default retry-after if not provided in response", () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any)
    })

    // Default is 30 seconds
    expect(result.current.secondsRemaining).toBe(30)
  })

  it("allows override of retry-after seconds", () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any, 60)
    })

    expect(result.current.secondsRemaining).toBe(60)
  })

  it("clears throttle after countdown expires", () => {
    const { result } = renderHook(() => useAuthThrottle())

    act(() => {
      result.current.handleThrottle({} as any, 2)
    })

    expect(result.current.isThrottled).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.isThrottled).toBe(false)
    expect(result.current.secondsRemaining).toBe(0)
  })
})
