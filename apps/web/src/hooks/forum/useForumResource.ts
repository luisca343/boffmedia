"use client"

import { useCallback, useEffect, useState, type DependencyList } from "react"
import type { ApiResponse } from "@/services/boffAPI"

// Boffmedia client fetch (the community/notifications pattern), NOT useRotomRequest
// (that hook belongs to SmartRotom and keys its effect on the fetcher identity,
// so an inline fetcher refetches on every render → request loop).
//
// Here the effect keys on the caller's *primitive* deps (slug/id/sort/…) plus a
// refetch nonce; the fetcher is intentionally excluded (its captured values ARE
// the deps). An `alive` guard drops races and post-unmount writes.
export function useForumResource<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: DependencyList,
) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    setIsLoading(true)
    setError(null)
    fetcher()
      .then((res) => {
        if (!alive) return
        if (res.error) setError(res.error)
        else setData(res.data)
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (alive) setIsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [...deps, nonce])

  return { data, error, isLoading, refetch, setData }
}
