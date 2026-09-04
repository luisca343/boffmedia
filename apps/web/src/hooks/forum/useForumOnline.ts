"use client"

import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"
import { useSessionQuery } from "@/lib/hooks/useSessionQuery"

/**
 * Who is on the forum right now. Shorter freshness than the app default: this
 * one IS live data, and `useForumPresence` re-pings every 60s, so a minute-old
 * cache would show a list that is always a ping behind.
 *
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
const ONLINE_STALE_MS = 30_000

export function useForumOnline() {
  const { data, error, isLoading, refetch } = useSessionQuery({
    queryKey: forumKeys.online() as any,
    queryFn: () => orThrow(ForumService.getOnline()),
    staleTime: ONLINE_STALE_MS,
  })

  return {
    online: (data ?? []) as unknown[],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
