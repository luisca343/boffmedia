import { useRotomRequestGated } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import { useMemo } from "react"
import type { Participant } from "@boffmedia/shared"

export type ParticipantStatus = "registered" | "confirmed" | "declined" | "removed"

/** Only these statuses count as "in the event" — declined/removed rows exist so
 *  re-join and expulsion have history, but they are not memberships. */
const ACTIVE_STATUSES: ReadonlySet<string> = new Set(["registered", "confirmed"])

export function useCurrentParticipant(eventId: number) {
  const { session } = useBoffSession()
  const userId = session?.user?.id

  // Gated, not just computed: an anonymous viewer has no participation to find,
  // so fetching the whole participant list on every event page was work whose
  // result was thrown away.
  const shouldFetch = Boolean(eventId && userId)

  const { data, error, isLoading, refetch } = useRotomRequestGated(
    shouldFetch,
    EventsService.getEventParticipants,
    eventId
  )

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
    error,
    isLoading: isLoading || !shouldFetch,
    refetch,
  }
}
