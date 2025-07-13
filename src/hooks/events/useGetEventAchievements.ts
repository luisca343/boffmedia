import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/boffmedia/eventsService"

export function useGetEventAchievements(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => eventsService.getEventAchievements(eventId),
    [eventId],
  )

  return {
    achievements: data || [],
    error,
    isLoading,
    refetch,
    setAchievements: setData,
  }
}