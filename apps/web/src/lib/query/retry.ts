import { ApiError } from "@/services/http/core"

/**
 * The retry policy for every Boffmedia query. Written out rather than left at
 * TanStack's default, which is three retries on ANY rejection — wrong for most
 * of what this API throws.
 *
 * The rules, and why each one exists:
 *
 *  1. A session waiting on its second factor never retries. A `twoFactorPending`
 *     session carries NO `accessToken` (see `TwoFactorGate`), so every guarded
 *     call 401s deterministically until the challenge is finished. Retrying
 *     turns one predictable 401 into four, each one a login-adjacent request the
 *     API rate-limits.
 *  2. No 4xx is ever retried. 401/403/404/409/422 are statements about the
 *     request, not the connection: the identical request fails identically.
 *     This is what TanStack's default gets most wrong — a 404 detail page would
 *     sit spinning through three pointless round trips.
 *  3. 5xx and transport failures ARE retried, up to MAX_QUERY_RETRIES. A
 *     rejection with no `statusCode` is a `TypeError` thrown by `fetch` (DNS,
 *     offline, connection reset) — exactly the transient case retrying is for.
 *  4. Mutations retry ZERO times regardless (set in `BoffQueryProvider`).
 *     `POST /forum/threads` is not idempotent; a retried "timeout" that actually
 *     succeeded posts twice.
 */
export const MAX_QUERY_RETRIES = 2

/** Base for the exponential backoff, doubled per attempt and capped. */
const RETRY_BASE_MS = 500
const RETRY_MAX_MS = 5_000

export interface RetryContext {
  /** True while the signed-in session is half-way through the 2FA challenge. */
  twoFactorPending: boolean
  maxRetries?: number
}

/**
 * The HTTP status behind a rejection, when there is one. `ApiError` (thrown by
 * `orThrow`) carries the envelope's status; a transport failure carries none.
 */
export function statusOf(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.statusCode
  const status = (error as { statusCode?: unknown } | null)?.statusCode
  return typeof status === "number" ? status : undefined
}

/** Pure decision function — the whole policy, and what the tests exercise. */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
  ctx: RetryContext,
): boolean {
  if (ctx.twoFactorPending) return false

  const max = ctx.maxRetries ?? MAX_QUERY_RETRIES
  // `failureCount` is 1 on the first rejection, so this allows exactly `max`
  // extra attempts after the original one.
  if (failureCount >= max) return false

  const status = statusOf(error)
  if (status === undefined) return true // transport failure — transient
  if (status >= 400 && status < 500) return false // deterministic, see rule 2
  return status >= 500
}

/** Exponential backoff, capped so an outage cannot push a retry minutes out. */
export function retryDelay(failureCount: number): number {
  return Math.min(RETRY_BASE_MS * 2 ** Math.max(0, failureCount - 1), RETRY_MAX_MS)
}

// ─── Two-factor flag ─────────────────────────────────────────────────────────
// The QueryClient's defaults are built once, outside React, so the retry
// function cannot call `useSession()`. `BoffQueryProvider` mirrors the session's
// `twoFactorPending` into this module-level flag on every change instead; the
// retry function reads it at decision time, not at construction time.

let twoFactorPending = false

export function setTwoFactorPending(pending: boolean): void {
  twoFactorPending = pending
}

export function isTwoFactorPending(): boolean {
  return twoFactorPending
}
