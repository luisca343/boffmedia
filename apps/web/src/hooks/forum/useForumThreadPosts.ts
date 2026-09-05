"use client"

import { useCallback } from "react"
import type { ForumPost, ForumPostList } from "@boffmedia/shared"
import { orThrow } from "@/services/boffAPI"
import { ForumService } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"
import { useSessionInfiniteQuery } from "@/lib/hooks/useSessionInfiniteQuery"
import { nextPageParam } from "./useForumThreads"

/** Page size for a thread's posts. `ListPostsQueryDto` caps `limit` at 50. */
export const FORUM_POSTS_PAGE_SIZE = 20

/**
 * A thread's posts, paged (audit W3). Same defect and same fix as
 * `useForumThreads` — the view grew `limit` past the DTO's `@Max(50)` and the
 * third "load more" silently 400'd, so posts past the 40th could not be read.
 *
 * Ordering is `createdAt asc, id asc` server-side, so the OP is first on page 1
 * and later pages continue after it rather than repeating it.
 *
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useForumThreadPosts(id: number) {
  const query = useSessionInfiniteQuery<ForumPostList>({
    queryKey: forumKeys.posts(id as any, { limit: FORUM_POSTS_PAGE_SIZE }) as any,
    initialPageParam: 1,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      orThrow(ForumService.getThreadPosts(id, { page: pageParam, limit: FORUM_POSTS_PAGE_SIZE })),
    getNextPageParam: (lastPage: ForumPostList, allPages: ForumPostList[]) =>
      nextPageParam(lastPage, allPages),
    enabled: Number.isFinite(id) && id > 0,
  } as any)

  const { fetchNextPage } = query
  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const pages = ((query.data as any)?.pages ?? []) as ForumPostList[]

  return {
    posts: pages.flatMap((p) => p.items) as ForumPost[],
    total: pages.length ? pages[0].total : 0,
    error: queryErrorText(query.error),
    isLoading: query.isLoading,
    refetch: query.refetch,
    hasMore: Boolean((query as any).hasNextPage),
    isLoadingMore: Boolean((query as any).isFetchingNextPage),
    loadMore,
  }
}
