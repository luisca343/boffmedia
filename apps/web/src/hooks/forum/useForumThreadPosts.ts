"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService, type ListPostsParams } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"

export function useForumThreadPosts(id: number, params: ListPostsParams = {}) {
  const { page, limit } = params
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: forumKeys.posts(id, { page, limit }),
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
