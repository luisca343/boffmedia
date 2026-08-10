import { useState } from "react"
import { CreateEventAchievementDto as CreateAchievementDto } from "@boffmedia/shared"
import { EventsService } from "@/services/api/boffmedia/eventsService"

// Imperative mutation — never auto-fires on mount (call createAchievement to run it).
export function useCreateAchievement(eventId: number) {
  const [createdAchievement, setCreatedAchievement] =
    useState<Awaited<ReturnType<typeof EventsService.createAchievement>>["data"]>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createAchievement = async (createAchievementDto: CreateAchievementDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await EventsService.createAchievement(eventId, createAchievementDto)
      if (res.error) setError(res.error)
      else setCreatedAchievement(res.data)
      return res
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createdAchievement,
    error,
    isLoading,
    refetch: createAchievement,
    createAchievement,
    setCreatedAchievement,
  }
}
