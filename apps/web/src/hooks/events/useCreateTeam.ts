import { useState } from "react"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { CreateTeamDto } from "@boffmedia/shared"

// Imperative mutation — never auto-fires on mount (call createTeam to run it).
export function useCreateTeam(eventId: number) {
  const [createdTeam, setCreatedTeam] =
    useState<Awaited<ReturnType<typeof EventsService.createTeam>>["data"]>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createTeam = async (createTeamDto: CreateTeamDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await EventsService.createTeam(eventId, createTeamDto)
      if (res.error) setError(res.error)
      else setCreatedTeam(res.data)
      return res
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createdTeam,
    error,
    isLoading,
    refetch: createTeam,
    createTeam,
    setCreatedTeam,
  }
}
