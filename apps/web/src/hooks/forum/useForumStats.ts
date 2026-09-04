"use client"

import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"
import { useSessionQuery } from "@/lib/hooks/useSessionQuery"

/**
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useForumStats() {
  const { data, error, isLoading, refetch } = useSessionQuery({
    queryKey: forumKeys.stats() as any,
    queryFn: () => orThrow(ForumService.getStats()),
  })

  return {
    stats: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
