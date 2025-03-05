import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"

export function useGetAchievements() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(eventsService.getAchievements)

  return {
    achievements: data || [],
    error,
    isLoading,
    refetch,
    setAchievements: setData,
  }
}

