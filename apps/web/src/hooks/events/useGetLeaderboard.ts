"use client"

import { useQuery } from "@tanstack/react-query"
import type { LeaderboardEntry } from "@boffmedia/shared"
import { orThrow } from "@/services/boffAPI"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"

/**
 * One event's leaderboard. `top` bounds what the caller RENDERS, not what the
 * server sends: `GET /events/:id/leaderboard` takes no pagination at all, so a
 * long-running event still ships its whole board over the wire (audit W3 — left
 * for A9, since capping it is an API-side change).
 *
 * The slice lives in `select` so React Query memoises it against the cached
 * array instead of the view rebuilding it on every render.
 */
export function useGetLeaderboard(eventId: number, top?: number) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.leaderboard(eventId),
    queryFn: () => orThrow(EventsService.getLeaderboard(eventId)),
    enabled: Number.isFinite(eventId) && eventId > 0,
    select: (rows: LeaderboardEntry[]) => (top === undefined ? rows : rows.slice(0, top)),
  })

  return {
    leaderboard: data ?? [],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
