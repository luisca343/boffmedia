"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale } from "../i18n"
import { getSteamFreeGames } from "../api"

/** Mirrors `SteamFreeGame` in `apps/api/src/app.service.ts`. */
export interface SteamFreeGame {
  steamID: string
  name: string
  storeUrl: string
  headerImage: string
  capsuleImage: string
  libraryImage: string
  shortDescription: string
  developers: string[]
  publishers: string[]
  releaseDate: string | null
  platforms: { windows: boolean; mac: boolean; linux: boolean }
  normalPrice: string
  currentPrice: string
  originalPriceCents: number
  discountPercent: number
  /** True = yours forever once claimed. False = a free weekend, not a keep. */
  isFreeToKeep: boolean
  isFreeTemporarily: boolean
  /** Unix seconds; null when Steam publishes no deadline. */
  freeToKeepEnds: number | null
  reviewLabel: string | null
  reviewPercentPositive: number | null
  reviewCount: number | null
}

export interface SteamFreeResult {
  games: SteamFreeGame[]
  count: number
  fetchedAt: string
  searchUrl: string
}

/**
 * The live "100 % off on Steam right now" list, from `/steamfree`. The API
 * caches Steam for ~10 min, so `refresh` is cheap but not instantaneous —
 * `fetchedAt` is the snapshot's real age, not the time of this call.
 */
export function useSteamFreeGames() {
  const locale = useLocale()
  const [data, setData] = useState<SteamFreeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getSteamFreeGames<SteamFreeResult>(locale)
      setData(res ?? null)
    } catch (err) {
      console.error("Failed to fetch Steam free games:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return {
    games: data?.games ?? [],
    fetchedAt: data?.fetchedAt ?? null,
    searchUrl: data?.searchUrl ?? null,
    loading,
    error,
    refresh: fetchGames,
  }
}

export default useSteamFreeGames
