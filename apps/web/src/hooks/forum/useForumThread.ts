"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"

export function useForumThread(id: number) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: forumKeys.thread(id),
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
