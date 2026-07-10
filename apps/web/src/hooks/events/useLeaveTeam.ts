import { useState } from "react"
import { EventsService } from "@/services/api/boffmedia/eventsService"

// Imperative mutation — never auto-fires on mount (call leaveTeam to run it).
export function useLeaveTeam(eventId: number, teamId: number) {
  const [leaveResult, setLeaveResult] =
    useState<Awaited<ReturnType<typeof EventsService.leaveTeam>>["data"]>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const leaveTeam = async (userId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await EventsService.leaveTeam(eventId, teamId, userId)
      if (res.error) setError(res.error)
      else setLeaveResult(res.data)
      return res
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    leaveResult,
    error,
    isLoading,
    refetch: leaveTeam,
    leaveTeam,
    setLeaveResult,
  }
}
