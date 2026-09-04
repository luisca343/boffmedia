"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"

export function useForumStats() {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: forumKeys.stats(),
    queryFn: () => orThrow(ForumService.getStats()),
  })

  return {
    stats: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
