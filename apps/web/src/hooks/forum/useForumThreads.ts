"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService, type ListThreadsParams } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"

export function useForumThreads(slug: string, params: ListThreadsParams = {}) {
  const { sort, page, limit } = params
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: forumKeys.threads(slug, { sort, page, limit }),
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
