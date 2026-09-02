"use client"

import * as React from "react"
import { getLocalGames, searchLocalGames } from "../api"
import type { SearchLocalGamesResult } from "@boffmedia/shared"

export const COMMON_REGIONS = ["USA", "Europe", "Japan", "World", "Korea", "Australia"]

/**
 * Local ROM library — searches the server-side myrient catalogue via the real
 * `ScrapeService`. A selected console loads that console's full list (query
 * filtered client-side); no console searches across all. Results are grouped by
 * console with per-file download links. No data is invented.
 */
export function useBiblioteca() {
  const [selectedConsole, setSelectedConsole] = React.useState<string | null>(null)
  const [regions, setRegions] = React.useState<string[]>([])
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchLocalGamesResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const toggleRegion = React.useCallback((r: string) => {
    setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }, [])
  const addRegion = React.useCallback((r: string) => {
    const t = r.trim()
    if (!t) return
    setRegions((prev) => (prev.includes(t) ? prev : [...prev, t]))
  }, [])
  const removeRegion = React.useCallback((r: string) => setRegions((prev) => prev.filter((x) => x !== r)), [])

  const selectConsole = React.useCallback((key: string) => {
    setSelectedConsole((prev) => (prev === key ? null : key))
    setResults(null)
  }, [])

  const search = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data: SearchLocalGamesResult
      if (selectedConsole) {
        const res = await getLocalGames(selectedConsole, regions)
        if (!res.success || !res.data) throw new Error(res.error ?? "loadError")
        const q = query.trim().toLowerCase()
        const files = q ? res.data.files.filter((f) => f.filename.toLowerCase().includes(q)) : res.data.files
        data = {
          query: query.trim(),
          totalCount: files.length,
          consoles: files.length > 0 ? [{ consoleKey: selectedConsole, consoleLabel: res.data.consoleLabel, count: files.length, files }] : [],
        }
      } else {
        const res = await searchLocalGames(query.trim(), regions)
        if (!res.success || !res.data) throw new Error(res.error ?? "searchError")
        data = res.data
      }
      setResults(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [selectedConsole, regions, query])

  return {
    selectedConsole, regions, query, loading, results, error,
    setQuery, toggleRegion, addRegion, removeRegion, selectConsole, search,
  }
}
