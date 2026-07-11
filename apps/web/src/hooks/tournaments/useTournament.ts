"use client"

import { useRotomRequest } from "@/hooks/useRotomRequest"
import { TournamentsService } from "@/services/api/boffmedia/tournamentsService"

/** Single tournament detail (meta + participants + format view) by slug. */
export function useTournament(slug: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    TournamentsService.get,
    slug,
  )
  return {
    tournament: data,
    error,
    isLoading,
    refetch,
    setTournament: setData,
  }
}
