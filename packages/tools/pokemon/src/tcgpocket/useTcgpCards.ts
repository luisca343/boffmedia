"use client"

import { useCallback, useEffect, useState } from "react"
import { toolDb } from "@boffmedia/tool-kit"
import { useLocale } from "../i18n"
import { TcgpService, type TcgCard } from "./service"

const SERIES = "tcgp"
const CACHE_NAMESPACE = "pokemon.tcgpocket"
const CACHE_COLLECTION = "catalog"

export interface TcgpSet {
  id: string
  name: string
  cardCount: number
  cards: TcgCard[]
  /** Distinct boosters (packs) present across this set's cards. */
  packs: { id: string; name: string }[]
}

export interface TcgpData {
  sets: TcgpSet[]
  cards: TcgCard[]
  byId: Record<string, TcgCard>
}

// Module-level promise cache keyed by locale so switching tabs (each a real
// route) reuses the already-fetched card database instead of re-hitting the API.
const CACHE = new Map<string, Promise<TcgpData>>()

function derivePacks(cards: TcgCard[]): { id: string; name: string }[] {
  const seen = new Map<string, string>()
  for (const c of cards) {
    for (const b of c.boosters || []) {
      if (b?.name && !seen.has(b.id || b.name)) seen.set(b.id || b.name, b.name)
    }
  }
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
}

async function load(locale: string): Promise<TcgpData> {
  const res = await TcgpService.getGroupedCards(SERIES, locale)
  if (!res.success) throw new Error(res.userMessage ?? res.error ?? "tcgp: cards unavailable")
  const groups = (res.data || []).filter(Boolean)

  const sets: TcgpSet[] = groups.map((g) => {
    const cards = (g.cards || []).filter(Boolean)
    return { id: g.setId, name: g.setName, cardCount: g.cardCount, cards, packs: derivePacks(cards) }
  })

  const cards = sets.flatMap((s) => s.cards)
  const byId: Record<string, TcgCard> = {}
  for (const c of cards) byId[c.id] = c

  return { sets, cards, byId }
}

export function fetchTcgpData(locale: string): Promise<TcgpData> {
  let p = CACHE.get(locale)
  if (!p) {
    p = load(locale).catch((e) => {
      CACHE.delete(locale) // don't cache failures
      throw e
    })
    CACHE.set(locale, p)
  }
  return p
}

export function useTcgpCards() {
  const locale = useLocale()
  const [data, setData] = useState<TcgpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)

  const refresh = useCallback(() => {
    CACHE.delete(locale)
    setReload((value) => value + 1)
  }, [locale])

  useEffect(() => {
    let live = true
    let apiFinished = false
    let hasUsableData = false
    setLoading(true)
    setError(false)

    // A successful catalogue is durable, so an API hiccup on a later launch
    // does not blank a tool that already has everything it needs to render.
    void toolDb(CACHE_NAMESPACE)
      .get<TcgpData>(CACHE_COLLECTION, locale)
      .then((cached) => {
        if (!live || (apiFinished && hasUsableData) || !cached) return
        hasUsableData = true
        setData(cached)
        setError(false)
        setLoading(false)
      })
      .catch(() => {
        // The cache is an optimisation; the API request remains authoritative.
      })

    fetchTcgpData(locale)
      .then((d) => {
        apiFinished = true
        hasUsableData = true
        if (!live) return
        setData(d)
        setError(false)
        setLoading(false)
        void toolDb(CACHE_NAMESPACE).put(CACHE_COLLECTION, locale, d)
      })
      .catch(() => {
        apiFinished = true
        if (live) {
          // If the cache won the race, keep stale-but-usable data on screen.
          setError(!hasUsableData)
          setLoading(false)
        }
      })
    return () => { live = false }
  }, [locale, reload])

  return { data, loading, error, refresh }
}
