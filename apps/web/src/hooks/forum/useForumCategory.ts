"use client"

import { useQuery } from "@tanstack/react-query"
import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"

export function useForumCategory(slug: string) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: forumKeys.category(slug),
    queryFn: () => orThrow(ForumService.getCategory(slug)),
    enabled: Boolean(slug),
  })

  return {
    category: data,
    error: queryErrorText(error),
    isLoading,
    refetch,
  }
}
