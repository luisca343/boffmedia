import { useRotomRequest } from "@/hooks/useRotomRequest"
import { Achievement, achievementService } from "@/services/api/smartrotom/achievementsService"

export function useGetAchievementForPlayer(uuid: string, achievementId: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => achievementService.getAchievementForPlayer(uuid, achievementId),
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

