"use client"

import { useCallback, useEffect, useState } from "react"
import {
  TournamentsService,
  type TournamentFilters,
  type TournamentSummaryApi,
} from "@/services/api/boffmedia/tournamentsService"

/** Tournament list. Filters are stringified into the effect key to avoid loops. */
export function useTournaments(filters?: TournamentFilters) {
  const [tournaments, setTournaments] = useState<TournamentSummaryApi[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(filters ?? {})

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await TournamentsService.list(filters ?? undefined)
      if (res.error) setError(res.error)
      else setTournaments(res.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
    // filters is captured via the stringified key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { tournaments, isLoading, error, refetch }
}
