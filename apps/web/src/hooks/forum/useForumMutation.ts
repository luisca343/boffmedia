import * as React from "react"
import type { ApiResponse } from "@/services/boffAPI"

// Pulls a human-readable message out of a failed ApiResponse envelope. The
// NestJS validation filter can send `message` as a string[], so the runtime
// value is widened past the declared string type before formatting.
export function apiErrorMessage(res: ApiResponse<unknown>, fallback: string): string {
  const raw: unknown = res.message
  if (Array.isArray(raw)) return raw.filter(Boolean).join(" ") || fallback
  if (typeof raw === "string" && raw) return raw
  if (typeof res.error === "string" && res.error) return res.error
  return fallback
}

// Thin imperative-mutation scaffold shared by the forum write hooks: wraps a
// service call with { isSubmitting, error } and returns the unwrapped data (or
// null on failure). Views own any refetch; the hooks stay stateless beyond this.
export function useForumMutation<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<ApiResponse<TData>>,
  fallbackError: string,
) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function run(...args: TArgs): Promise<TData | null> {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fn(...args)
      if (!res.success) {
        setError(apiErrorMessage(res, fallbackError))
        return null
      }
      return (res.data ?? null) as TData | null
    } catch (e) {
      setError(e instanceof Error ? e.message : fallbackError)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { run, isSubmitting, error, setError }
}
