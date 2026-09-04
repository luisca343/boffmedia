"use client"

import { useCallback } from "react"
import type { Event } from "@boffmedia/shared"
import { orThrow } from "@/services/boffAPI"
import { EventsService, type EventFilters } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"
import { useSessionQuery } from "@/lib/hooks/useSessionQuery"
import { useSessionInfiniteQuery } from "@/lib/hooks/useSessionInfiniteQuery"

/**
 * The full event list for a given filter set.
 *
 * Deliberately UNCAPPED: the remaining callers are pickers and aggregates (the
 * admin event/team/achievement forms, the calendar, the landing carousel) that
 * break silently if an item is missing from the list. The hot, user-facing list
 * is `/eventos`, and that one uses `useEventsPaged` below.
 *
 * The API has no default limit on `/events` either — noted for A9, since capping
 * it is an `apps/api` change and this pass does not touch that app.
 *
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useGetEvents(filters?: EventFilters) {
  const { data, error, isLoading, refetch } = useSessionQuery({
    queryKey: eventKeys.list(filters) as any,
    queryFn: () => orThrow(EventsService.getEvents(filters)),
  })

  return {
    events: (data ?? []) as Event[],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}

/** Page size for the paged list. `ListEventsQueryDto` caps `limit` at 100. */
export const EVENTS_PAGE_SIZE = 24

/**
 * The `/eventos` list, paged (audit W3: this list had no limit at all and
 * rendered every event the server owned on first paint).
 *
 * Offset pagination, because that is what `ListEventsQueryDto` exposes — there
 * is no cursor. A short page means the end: the API returns no total, so the
 * only end-of-list signal is a page smaller than the one asked for.
 *
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useEventsPaged(filters?: Omit<EventFilters, "limit" | "offset">) {
  const query = useSessionInfiniteQuery<Event[]>({
    queryKey: eventKeys.list({ ...filters, limit: EVENTS_PAGE_SIZE }) as any,
    initialPageParam: 0,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      orThrow(
        EventsService.getEvents({ ...filters, limit: EVENTS_PAGE_SIZE, offset: pageParam }),
      ),
    getNextPageParam: (lastPage: Event[], allPages: Event[][]) =>
      lastPage.length < EVENTS_PAGE_SIZE ? undefined : allPages.length * EVENTS_PAGE_SIZE,
  } as any)

  const { fetchNextPage } = query
  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  return {
    events: (query.data as any)?.pages?.flat() ?? [],
    error: queryErrorText(query.error),
    isLoading: query.isLoading,
    refetch: query.refetch,
    hasMore: (query as any).hasNextPage,
    isLoadingMore: (query as any).isFetchingNextPage,
    loadMore,
  }
}
