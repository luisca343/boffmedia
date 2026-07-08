"use client"

import * as React from "react"
import useGetKeys from "../_hooks/useGetKeys"
import useFetchSteamData from "../_hooks/useFetchSteamData"
import type { KvItem } from "../_components/ui/kv-kit"

export type KeysSort = "estado" | "nombre" | "stock"

/**
 * v3 view-model for the Steam keys catalogue. Wraps the real `useGetKeys`
 * (Google-sheet-backed `/steamkeys`) — aggregating duplicate rows into a stock
 * count — and the real `useFetchSteamData` (`/steamdata/:id`, Steam appdetails)
 * for the on-open detail. No data is invented: fields absent from the sheet
 * (price, genres, media) only appear once the per-game detail is fetched.
 */
export function useKeysV3() {
  const { keys, loading } = useGetKeys()
  const { selectedGame, isModalVisible, setIsModalVisible, fetchGameData } = useFetchSteamData()

  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<"available" | "all">("available")
  const [sort, setSort] = React.useState<KeysSort>("estado")
  const [selected, setSelected] = React.useState<KvItem | null>(null)

  // Collapse duplicate keys (same game + claimed state) into one card w/ a count.
  const items = React.useMemo<KvItem[]>(() => {
    const named = keys.filter((k) => k.name && k.name.trim() !== "")
    const byKey = new Map<string, KvItem>()
    for (const k of named) {
      const given = k.claimed === "s"
      const id = `${k.name}::${given}`
      const existing = byKey.get(id)
      if (existing) {
        existing.count += 1
      } else {
        byKey.set(id, {
          name: k.name,
          steamID: k.steamID,
          imageUrl: k.imageUrl,
          given,
          source: k.source ?? "",
          count: 1,
        })
      }
    }
    return [...byKey.values()]
  }, [keys])

  const counts = React.useMemo(() => {
    let available = 0
    let given = 0
    for (const it of items) {
      if (it.given) given += it.count
      else available += it.count
    }
    return { total: available + given, available, given }
  }, [items])

  const list = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    let out = items.filter((it) => (filter === "all" ? true : !it.given))
    if (term) out = out.filter((it) => it.name.toLowerCase().includes(term) || it.source.toLowerCase().includes(term))
    out = [...out].sort((a, b) => {
      if (sort === "nombre") return a.name.localeCompare(b.name, "es")
      if (sort === "stock") return b.count - a.count
      // estado: available first, then by name
      if (a.given !== b.given) return a.given ? 1 : -1
      return a.name.localeCompare(b.name, "es")
    })
    return out
  }, [items, q, filter, sort])

  const open = React.useCallback(
    (item: KvItem) => {
      setSelected(item)
      fetchGameData(item.steamID)
    },
    [fetchGameData],
  )
  const close = React.useCallback(() => {
    setSelected(null)
    setIsModalVisible(false)
  }, [setIsModalVisible])

  const resetFilters = React.useCallback(() => {
    setQ("")
    setFilter("all")
  }, [])

  return {
    q,
    setQ,
    filter,
    setFilter,
    sort,
    setSort,
    list,
    counts,
    loading,
    selected,
    game: selectedGame,
    modalOpen: isModalVisible && selected != null,
    detailLoading: selected != null && (!selectedGame || selectedGame.steamID !== selected.steamID),
    open,
    close,
    resetFilters,
  }
}
