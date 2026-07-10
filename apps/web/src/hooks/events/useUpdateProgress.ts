import { useState } from "react"
import { UpdateProgressDto } from "@boffmedia/shared"
import { EventsService } from "@/services/api/boffmedia/eventsService"

// Imperative mutation — never auto-fires on mount (call updateProgress to run it).
export function useUpdateProgress(eventId: number) {
  const [updateResult, setUpdateResult] =
    useState<Awaited<ReturnType<typeof EventsService.updateProgress>>["data"]>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const updateProgress = async (updateProgressDto: UpdateProgressDto) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await EventsService.updateProgress(eventId, updateProgressDto)
      if (res.error) setError(res.error)
      else setUpdateResult(res.data)
      return res
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateResult,
    error,
    isLoading,
    refetch: updateProgress,
    updateProgress,
    setUpdateResult,
  }
}
