import { useRotomRequest } from "@/hooks/useRotomRequest"
import { EventsService } from "@/services/api/boffmedia/eventsService"
import { useBoffSession } from "@/services/useBoffSession"
import { useMemo } from "react"

export function useCurrentParticipant(eventId: number) {
  const { session } = useBoffSession()
  const userId = session?.user?.id
  
  const shouldFetch = eventId && userId
  
  const { data, error, isLoading, refetch } = useRotomRequest(EventsService.getEventParticipants, eventId)

  const participantId = useMemo(() => {
    if (!userId || !data) return null
    const participant = data.find(p => p.userId === parseInt(userId))
    return participant?.id || null
  }, [userId, data])

  return {
    participantId,
    participants: data,
    error,
    isLoading: isLoading || !shouldFetch,
    refetch,
  }
}