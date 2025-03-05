import { useRotomRequest } from "@/hooks/useRotomRequest"
import { achievementService } from "@/services/api/smartrotom/achievementsService"

export function useGetAchievements(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(achievementService.getAchievements, uuid)

  return {
    achievements: data || [],
    error,
    isLoading,
    refetch,
    setAchievements: setData,
  }
}

