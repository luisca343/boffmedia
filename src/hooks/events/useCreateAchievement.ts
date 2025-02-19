import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import { CreateAchievementDto } from "@/types/dto/create-achievement.dto"

export function useCreateAchievement(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (createAchievementDto) => eventsService.createAchievement(eventId, createAchievementDto),
    [eventId],
  )

  const createAchievement = (createAchievementDto: CreateAchievementDto) => {
    return eventsService.createAchievement(eventId, createAchievementDto)
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