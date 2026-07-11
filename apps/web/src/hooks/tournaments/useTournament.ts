"use client"

import { useEffect } from "react"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { TournamentsService } from "@/services/api/boffmedia/tournamentsService"

/**
 * Single tournament detail (meta + participants + format view) by slug. While the
 * tournament is live it polls every 20s so spectators see results land without a
 * manual refresh.
 */
export function useTournament(slug: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    TournamentsService.get,
    slug,
  )

  const live = data?.status === "live"
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => refetch(), 20000)
    return () => clearInterval(id)
  }, [live, refetch])

  return {
    tournament: data,
    error,
    isLoading,
    refetch,
    setTournament: setData,
  }
}
