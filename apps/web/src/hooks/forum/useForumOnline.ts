"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"

/**
 * Who is on the forum right now. Shorter freshness than the app default: this
 * one IS live data, and `useForumPresence` re-pings every 60s, so a minute-old
 * cache would show a list that is always a ping behind.
 */
const ONLINE_STALE_MS = 30_000

export function useForumOnline() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: forumKeys.online(),
    queryFn: () => orThrow(ForumService.getOnline()),
    staleTime: ONLINE_STALE_MS,
  })

  return {
    online: data ?? [],
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
