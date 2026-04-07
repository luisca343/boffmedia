import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetAchievements() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(EventsService.getAchievements)

  return {
    achievements: data || [],
    error,
    isLoading,
    refetch,
    setAchievements: setData,
  }
}

