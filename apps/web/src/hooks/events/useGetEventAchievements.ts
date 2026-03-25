import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"

export function useGetEventAchievements(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    () => EventsService.getEventAchievements(eventId),
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