"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Participant } from "@boffmedia/shared"
import { orThrow } from "@/services/boffAPI"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { queryErrorText } from "@/lib/query/errorText"
import { useBoffSession } from "@/services/useBoffSession"
import { eventKeys } from "./keys"

export type ParticipantStatus = "registered" | "confirmed" | "declined" | "removed"

/** Only these statuses count as "in the event" — declined/removed rows exist so
 *  re-join and expulsion have history, but they are not memberships. */
const ACTIVE_STATUSES: ReadonlySet<string> = new Set(["registered", "confirmed"])

/**
 * Still fetches the WHOLE participant list, on purpose: `activeCount` is derived
 * from it, so a `limit` would silently under-count the badge on every busy
 * event. The real fix is an API-side `/participants/me` plus a count — left for
 * A9 rather than papered over here.
 *
 * Gated, not just computed: an anonymous viewer has no participation to find,
 * so fetching the list on every event page was work whose result was discarded.
 */
export function useCurrentParticipant(eventId: number) {
  const { session } = useBoffSession()
  const userId = session?.user?.id

  const shouldFetch = Boolean(eventId && userId)

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: eventKeys.participants(eventId),
    queryFn: () => orThrow(EventsService.getEventParticipants(eventId)),
    enabled: shouldFetch,
  })

  const { participant, activeCount } = useMemo(() => {
    const rows: Participant[] = data ?? []
    return {
      participant: userId ? rows.find((p) => p.userId === parseInt(userId)) ?? null : null,
      activeCount: rows.filter((p) => ACTIVE_STATUSES.has(p.status)).length,
    }
  }, [userId, data])

  const status = (participant?.status ?? null) as ParticipantStatus | null

  return {
    /** The caller's `event_participants` ROW id (not `participantId`); null when absent. */
    participantId: participant?.id ?? null,
    status,
    isParticipating: status !== null && ACTIVE_STATUSES.has(status),
    /** Participants with a live membership — what a public count should show. */
    activeCount,
    participants: data,
    error: queryErrorText(error),
    // A disabled query reports `isLoading: false`; the pre-query hook kept
    // callers on a loader until the gate opened, and the views depend on that.
    isLoading: isLoading || !shouldFetch,
    refetch,
  }
}
