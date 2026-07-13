"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "tx-favorites"

/**
 * Starred destinations. A pure client preference — there is no favourites endpoint, and
 * inventing one would mean a migration for something the player only needs on their own
 * machine. Read on mount (not during render) so SSR and the first client paint agree.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setFavorites(JSON.parse(raw) as string[])
    } catch {
      /* corrupt or unavailable storage — start empty */
    }
  }, [])

  const toggle = useCallback((id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage full or blocked — the toggle still works for this session */
      }
      return next
    })
  }, [])

  return { favorites, toggle }
}
