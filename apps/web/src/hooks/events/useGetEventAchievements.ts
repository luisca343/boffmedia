"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"

export function useGetEventAchievements(eventId: number) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.eventAchievements(eventId),
    queryFn: () => orThrow(EventsService.getEventAchievements(eventId)),
    enabled: Number.isFinite(eventId) && eventId > 0,
  })

  return {
    achievements: data ?? [],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
