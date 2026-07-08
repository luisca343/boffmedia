"use client"

import { useCallback, useState } from "react"
import { boffPOST } from "@/services/boffAPI"

export interface PackProbabilities {
  newCardProbabilities: number[]
  aggregateProbability: number
}
export interface BestPackResult {
  bestPack?: { name?: string }
  allPackProbabilities: Record<string, PackProbabilities>
}

export interface OddsRow {
  pack: string
  perSlot: number[]
  aggregate: number
  best: boolean
}

/** The real `/best-pack` endpoint scores every booster for a given player by
 *  how likely it is to yield a card they don't own yet. Requires a username. */
export function useBestPack(username: string | null | undefined) {
  const [rows, setRows] = useState<OddsRow[] | null>(null)
  const [bestName, setBestName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    if (!username) return
    setLoading(true)
    setError(null)
    try {
      const res = await boffPOST<BestPackResult>("/herramientas/ptcgp/best-pack", { username })
      const data = res?.data
      if (!data?.allPackProbabilities) {
        setError(res?.message || "no-data")
        setRows([])
        return
      }
      const best = data.bestPack?.name?.toLowerCase()
      const parsed: OddsRow[] = Object.entries(data.allPackProbabilities)
        .map(([pack, p]) => ({
          pack,
          perSlot: p.newCardProbabilities || [],
          aggregate: p.aggregateProbability || 0,
          best: pack.toLowerCase() === best,
        }))
        .sort((a, b) => b.aggregate - a.aggregate)
      if (parsed.length) parsed[0].best = true
      setRows(parsed)
      setBestName(parsed[0]?.pack ?? null)
    } catch {
      setError("error")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [username])

  const reset = useCallback(() => { setRows(null); setBestName(null); setError(null) }, [])

  return { rows, bestName, loading, error, run, reset }
}
