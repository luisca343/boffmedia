"use client"

import { useCallback } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import type { Event } from "@boffmedia/shared"
import { orThrow } from "@/services/boffAPI"
import { EventsService, type EventFilters } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { eventKeys } from "./keys"

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
 */
export function useGetEvents(filters?: EventFilters) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => orThrow(EventsService.getEvents(filters)),
  })

  return {
    events: data ?? [],
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
 */
export function useEventsPaged(filters?: Omit<EventFilters, "limit" | "offset">) {
  const query = useInfiniteQuery({
    queryKey: eventKeys.list({ ...filters, limit: EVENTS_PAGE_SIZE }),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      orThrow(
        EventsService.getEvents({ ...filters, limit: EVENTS_PAGE_SIZE, offset: pageParam }),
      ),
    getNextPageParam: (lastPage: Event[], allPages: Event[][]) =>
      lastPage.length < EVENTS_PAGE_SIZE ? undefined : allPages.length * EVENTS_PAGE_SIZE,
  })

  const { fetchNextPage } = query
  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  return {
    events: query.data?.pages.flat() ?? [],
    error: queryErrorText(query.error),
    isLoading: query.isLoading,
    refetch: query.refetch,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore,
  }
}
