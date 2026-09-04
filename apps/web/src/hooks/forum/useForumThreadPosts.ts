"use client"

import { keepPreviousData } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService, type ListPostsParams } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"
import { useSessionQuery } from "@/lib/hooks/useSessionQuery"

/**
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useForumThreadPosts(id: number, params: ListPostsParams = {}) {
  const { page, limit } = params
  const { data, error, isLoading, refetch } = useSessionQuery({
    queryKey: forumKeys.posts(id as any, { page, limit }) as any,
    queryFn: () => orThrow(ForumService.getThreadPosts(id, { page, limit })),
    enabled: Number.isFinite(id) && id > 0,
    placeholderData: keepPreviousData,
  })

  return {
    postList: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
