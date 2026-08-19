"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import useFetchSteamData from "../../_hooks/useFetchSteamData"
import useSteamFreeGames, { type SteamFreeGame } from "../_hooks/useSteamFreeGames"

export type SteamFreeSort = "ends" | "value" | "rating" | "name"

/** Remaining time on a promo, already broken down for display. */
export interface Countdown {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Under 24 h left — the UI escalates to a warning tone. */
  urgent: boolean
  expired: boolean
}

export function countdownFrom(endsUnix: number | null, nowMs: number): Countdown | null {
  if (!endsUnix) return null
  const total = Math.max(0, endsUnix * 1000 - nowMs)
  const s = Math.floor(total / 1000)
  return {
    total,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    urgent: total > 0 && total < 24 * 3600 * 1000,
    expired: total <= 0,
  }
}

/**
 * v3 view-model for the Steam free-promos board. The list itself comes from
 * `/steamfree` (store search + IStoreBrowseService); the on-open detail reuses
 * the same `/steamdata/:id` appdetails call the Steam Keys tool uses, because
 * screenshots, trailers and genres are the only fields the list endpoint omits.
 */
export function useSteamFreeV3() {
  const locale = useLocale()
  const { games, fetchedAt, searchUrl, loading, error, refresh } = useSteamFreeGames()
  const { selectedGame, isModalVisible, setIsModalVisible, fetchGameData } = useFetchSteamData()

  const [q, setQ] = React.useState("")
  const [sort, setSort] = React.useState<SteamFreeSort>("ends")
  const [selected, setSelected] = React.useState<SteamFreeGame | null>(null)

  // One shared clock: every card reads the same tick instead of owning a timer.
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const list = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    let out = games
    if (term) {
      out = out.filter(
        (g) =>
          g.name.toLowerCase().includes(term) ||
          g.developers.some((d) => d.toLowerCase().includes(term)) ||
          g.publishers.some((p) => p.toLowerCase().includes(term)),
      )
    }
    return [...out].sort((a, b) => {
      if (sort === "value") return b.originalPriceCents - a.originalPriceCents
      if (sort === "rating") return (b.reviewPercentPositive ?? -1) - (a.reviewPercentPositive ?? -1)
      if (sort === "name") return a.name.localeCompare(b.name, locale)
      // ends: soonest deadline first, undated promos last
      if (a.freeToKeepEnds !== b.freeToKeepEnds) {
        if (a.freeToKeepEnds == null) return 1
        if (b.freeToKeepEnds == null) return -1
        return a.freeToKeepEnds - b.freeToKeepEnds
      }
      return a.name.localeCompare(b.name, locale)
    })
  }, [games, q, sort, locale])

  const stats = React.useMemo(() => {
    const valueCents = games.reduce((sum, g) => sum + g.originalPriceCents, 0)
    const deadlines = games.map((g) => g.freeToKeepEnds).filter((d): d is number => d != null)
    return {
      count: games.length,
      keepCount: games.filter((g) => g.isFreeToKeep).length,
      valueCents,
      soonest: deadlines.length ? Math.min(...deadlines) : null,
    }
  }, [games])

  const open = React.useCallback(
    (game: SteamFreeGame) => {
      setSelected(game)
      fetchGameData(game.steamID)
    },
    [fetchGameData],
  )

  const close = React.useCallback(() => {
    setSelected(null)
    setIsModalVisible(false)
  }, [setIsModalVisible])

  return {
    q,
    setQ,
    sort,
    setSort,
    list,
    stats,
    now,
    loading,
    error,
    refresh,
    fetchedAt,
    searchUrl,
    selected,
    detail: selectedGame,
    modalOpen: isModalVisible && selected != null,
    detailLoading: selected != null && (!selectedGame || selectedGame.steamID !== selected.steamID),
    open,
    close,
    clearSearch: React.useCallback(() => setQ(""), []),
  }
}
