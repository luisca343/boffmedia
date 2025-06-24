import { useRotomRequest } from "@/hooks/useRotomRequest"
import { AchievementService } from "@/services/api/smartrotom/achievementsService"

export function useGetAchievements(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(AchievementService.getAchievements, uuid)

  return {
    achievements: data || [],
    error,
    isLoading,
    refetch,
    setAchievements: setData,
  }
}

