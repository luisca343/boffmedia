"use client"

import { keepPreviousData } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService, type ListThreadsParams } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"
import { useSessionQuery } from "@/lib/hooks/useSessionQuery"

/**
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useForumThreads(slug: string, params: ListThreadsParams = {}) {
  const { sort, page, limit } = params
  const { data, error, isLoading, refetch } = useSessionQuery({
    queryKey: forumKeys.threads(slug as any, { sort, page, limit }) as any,
    queryFn: () => orThrow(ForumService.getCategoryThreads(slug, { sort, page, limit })),
    enabled: Boolean(slug),
    // Paging/sorting keeps the previous page on screen instead of flashing the
    // list back to a spinner — the cache is what makes this free.
    placeholderData: keepPreviousData,
  })

  return {
    threadList: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
