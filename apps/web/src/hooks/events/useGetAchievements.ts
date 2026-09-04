"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"

export function useGetAchievements() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.achievements(),
    queryFn: () => orThrow(EventsService.getAchievements()),
  })

  return {
    achievements: data ?? [],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
