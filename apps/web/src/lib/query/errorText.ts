import { ApiError } from "@/services/http/core"

/**
 * The `error: string | null` the converted hooks keep returning.
 *
 * The pre-query hooks all exposed a string, and every read call site only tests
 * it for truthiness before rendering its own translated copy — so keeping the
 * shape avoids churning ~20 views for no behavioural gain. Prefer the server's
 * explicit Spanish `userMessage` when it sent one; fall back to the machine
 * message, which is only ever a truthiness signal here.
 *
 * For copy a user actually READS, use `useApiError()` — it resolves the stable
 * error code against the locale catalogue. This helper deliberately does not,
 * because it has no translator.
 */
export function queryErrorText(error: unknown): string | null {
  if (!error) return null
  if (error instanceof ApiError) return error.userMessage ?? error.message
  return error instanceof Error ? error.message : String(error)
}
