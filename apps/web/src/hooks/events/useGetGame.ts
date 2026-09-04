"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"

export function useGetGame(id: number) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.game(id),
    queryFn: () => orThrow(EventsService.getGame(id)),
    enabled: Number.isFinite(id) && id > 0,
  })

  return {
    game: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
