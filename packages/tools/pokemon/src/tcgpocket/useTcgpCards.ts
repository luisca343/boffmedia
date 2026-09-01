"use client"

import { useEffect, useState } from "react"
import { useLocale } from "../i18n"
import { TcgpService, type TcgCard } from "./service"

const SERIES = "tcgp"

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

  useEffect(() => {
    let live = true
    setLoading(true)
    setError(false)
    fetchTcgpData(locale)
      .then((d) => { if (live) { setData(d); setLoading(false) } })
      .catch(() => { if (live) { setError(true); setLoading(false) } })
    return () => { live = false }
  }, [locale])

  return { data, loading, error }
}
