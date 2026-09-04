"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ApiResponse } from "@/services/boffAPI"
import { forumKeys } from "./keys"

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

/**
 * The forum write scaffold, now on TanStack `useMutation`. The public shape is
 * unchanged — `{ run, isSubmitting, error, setError }`, with `run` resolving to
 * the data or `null` — because ten call sites render `error` as a string and
 * disable their button on `isSubmitting`.
 *
 * Two things it does that the hand-rolled version did not:
 *
 *  1. A REF guard against double submission. `isSubmitting` is state, and so is
 *     `mutation.isPending`: two clicks in the same tick both read `false` and
 *     both reach the network, which is how a reply gets double-posted. Same trap
 *     EventDetailView's join/leave guard documents — React Query does not close
 *     it for you, and `retry: false` on mutations only covers the other half.
 *  2. Invalidates the forum domain after a successful write, so the thread and
 *     post lists refresh from one rule instead of each view wiring its own
 *     `refetch()`. Views that still call `refetch()` keep working.
 *
 * `error` stays a string rather than the mutation's Error object: the fallbacks
 * are per-action Spanish copy owned by the calling hook.
 */
export function useForumMutation<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<ApiResponse<TData>>,
  fallbackError: string,
) {
  const queryClient = useQueryClient()
  const [error, setError] = React.useState<string | null>(null)
  const inFlight = React.useRef(false)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: TArgs) => {
      const res = await fn(...args)
      if (!res.success) throw new Error(apiErrorMessage(res, fallbackError))
      return (res.data ?? null) as TData | null
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: forumKeys.all() })
    },
  })

  const run = React.useCallback(
    async (...args: TArgs): Promise<TData | null> => {
      if (inFlight.current) return null
      inFlight.current = true
      setError(null)
      try {
        return await mutateAsync(args)
      } catch (e) {
        setError(e instanceof Error ? e.message : fallbackError)
        return null
      } finally {
        inFlight.current = false
      }
    },
    [mutateAsync, fallbackError],
  )

  return { run, isSubmitting: isPending, error, setError }
}
