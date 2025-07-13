import { CreateAchievementDto } from "@/generated/api"
import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useCreateAchievement(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (createAchievementDto) => EventsService.createAchievement(eventId, createAchievementDto),
    [eventId],
  )

  const createAchievement = (createAchievementDto: CreateAchievementDto) => {
    return EventsService.createAchievement(eventId, createAchievementDto)
  }

  return {
    createdAchievement: data,
    error,
    isLoading,
    refetch,
    createAchievement,
    setCreatedAchievement: setData,
  }
}