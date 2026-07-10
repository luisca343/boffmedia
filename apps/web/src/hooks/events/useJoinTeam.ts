import { useState } from "react"
import { EventsService } from "@/services/api/boffmedia/eventsService"

// Imperative mutation — never auto-fires on mount (call joinTeam to run it).
export function useJoinTeam(eventId: number, teamId: number) {
  const [joinResult, setJoinResult] =
    useState<Awaited<ReturnType<typeof EventsService.joinTeam>>["data"]>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const joinTeam = async (userId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await EventsService.joinTeam(eventId, teamId, { participantId: userId })
      if (res.error) setError(res.error)
      else setJoinResult(res.data)
      return res
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    joinResult,
    error,
    isLoading,
    refetch: joinTeam,
    joinTeam,
    setJoinResult,
  }
}
