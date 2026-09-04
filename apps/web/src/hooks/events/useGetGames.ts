"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"

export function useGetGames() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.games(),
    queryFn: () => orThrow(EventsService.getGames()),
  })

  return {
    games: data ?? [],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
