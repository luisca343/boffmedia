import { useRotomRequest } from "@/hooks/useRotomRequest"
import { achievementService } from "@/services/api/smartrotom/achievementsService"

export function useGetAchievementForPlayer(uuid: string, achievementId: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => achievementService.getAchievementById(uuid, achievementId),
    [uuid, achievementId],
  )

  return {
    achievement: data,
    error,
    isLoading,
    refetch,
    setAchievement: setData,
  }
}

