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
export function useForumThread(id: number) {
  const { data, error, isLoading, refetch } = useSessionQuery({
    queryKey: forumKeys.thread(id) as any,
    queryFn: () => orThrow(ForumService.getThread(id)),
    enabled: Number.isFinite(id) && id > 0,
  })

  return {
    thread: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
