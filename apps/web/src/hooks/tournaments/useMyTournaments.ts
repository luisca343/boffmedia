"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
  TournamentsService,
  type MyTournamentApi,
} from "@/services/api/boffmedia/tournamentsService"

/** Tournaments the signed-in user has entered (profile panel). */
export function useMyTournaments() {
  const { status } = useSession()
  const [tournaments, setTournaments] = useState<MyTournamentApi[]>([])
  const [isLoading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (status !== "authenticated") return
    setLoading(true)
    const r = await TournamentsService.mine()
    if (r.data) setTournaments(r.data)
    setLoading(false)
  }, [status])

  useEffect(() => {
    if (status === "authenticated") refetch()
    else if (status === "unauthenticated") setLoading(false)
  }, [status, refetch])

  return { tournaments, isLoading, refetch }
}
