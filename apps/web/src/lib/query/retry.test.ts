import { describe, expect, it, vi } from "vitest"

// `services/http/core` parses `config/env` at import time, and that schema
// requires NEXT_PUBLIC_API — which no unit-test process has, since these run in
// a bare node environment by design (see vitest.config.mts). Only the class
// identity matters here, so it is stubbed. retry.ts imports the same specifier,
// so its `instanceof` check tests against this same class and the branch stays
// covered rather than being skipped.
vi.mock("@/services/http/core", () => {
  class ApiError extends Error {
    statusCode: number
    constructor(envelope: { statusCode: number; message?: string }) {
      super(envelope.message ?? `HTTP ${envelope.statusCode}`)
      this.name = "ApiError"
      this.statusCode = envelope.statusCode
    }
  }
  return { ApiError }
})

const { ApiError } = await import("@/services/http/core")

import {
  MAX_QUERY_RETRIES,
  retryDelay,
  shouldRetryQuery,
  statusOf,
  type RetryContext,
} from "./retry"

/**
 * The retry policy is the one part of the query layer that fails INVISIBLY when
 * it is wrong: a bad rule does not throw, it just makes three extra requests
 * nobody sees, or silently gives up on a recoverable one. So each rule is pinned
 * here rather than left to the comment in `retry.ts`.
 */

const settled: RetryContext = { twoFactorPending: false }

/** An `ApiError` as `orThrow` builds it, for a given status. */
const httpError = (statusCode: number) =>
  new ApiError({ statusCode, message: `HTTP ${statusCode}` } as never)

/** What `fetch` throws when the request never reached a server. */
const transportError = () => new TypeError("Failed to fetch")

describe("shouldRetryQuery", () => {
  it("never retries while the session is waiting on its second factor", () => {
    // The rule that matters most, and the one a future refactor is likeliest to
    // drop: a `twoFactorPending` session carries no accessToken, so every
    // guarded call 401s deterministically. Retrying turns one predictable 401
    // into four login-adjacent requests against a rate-limited endpoint.
    const pending: RetryContext = { twoFactorPending: true }
    expect(shouldRetryQuery(1, transportError(), pending)).toBe(false)
    expect(shouldRetryQuery(1, httpError(503), pending)).toBe(false)
    expect(shouldRetryQuery(1, httpError(401), pending)).toBe(false)
  })

  it("does not retry any 4xx", () => {
    // Statements about the request, not the connection — the identical request
    // fails identically. This is what TanStack's default gets wrong.
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      expect(shouldRetryQuery(1, httpError(status), settled)).toBe(false)
    }
  })

  it("retries 5xx and transport failures", () => {
    for (const status of [500, 502, 503, 504]) {
      expect(shouldRetryQuery(1, httpError(status), settled)).toBe(true)
    }
    // No statusCode at all: DNS, offline, connection reset — the transient case
    // retrying exists for.
    expect(shouldRetryQuery(1, transportError(), settled)).toBe(true)
  })

  it("stops at MAX_QUERY_RETRIES", () => {
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, httpError(500), settled)).toBe(true)
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, httpError(500), settled)).toBe(false)
    expect(shouldRetryQuery(MAX_QUERY_RETRIES + 1, httpError(500), settled)).toBe(false)
  })

  it("honours a caller's lower cap", () => {
    expect(shouldRetryQuery(1, httpError(500), { ...settled, maxRetries: 1 })).toBe(false)
  })
})

describe("statusOf", () => {
  it("reads an ApiError's status and reports none for a transport failure", () => {
    expect(statusOf(httpError(404))).toBe(404)
    expect(statusOf(transportError())).toBeUndefined()
    // Defensive: a rejection that is not an object at all must not throw here,
    // or the retry decision itself becomes the error.
    expect(statusOf(null)).toBeUndefined()
    expect(statusOf("boom")).toBeUndefined()
  })

  it("reads a plain object carrying statusCode", () => {
    // Not every rejection reaching the query layer is an ApiError instance —
    // anything thrown across a module boundary can lose its prototype.
    expect(statusOf({ statusCode: 503 })).toBe(503)
    expect(statusOf({ statusCode: "503" })).toBeUndefined()
  })
})

describe("retryDelay", () => {
  it("backs off exponentially and caps", () => {
    expect(retryDelay(1)).toBe(500)
    expect(retryDelay(2)).toBe(1_000)
    expect(retryDelay(3)).toBe(2_000)
    // Capped, so an outage cannot push a retry minutes into the future and make
    // the page look permanently dead.
    expect(retryDelay(20)).toBe(5_000)
  })

  it("does not go negative or NaN on a zero failure count", () => {
    expect(retryDelay(0)).toBe(500)
  })
})
