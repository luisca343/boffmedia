"use client"

import { useCallback } from "react"
import type { ForumThread, ForumThreadList } from "@boffmedia/shared"
import { orThrow } from "@/services/boffAPI"
import { ForumService, type ThreadSort } from "@/services/api/boffmedia/forumService"
import { queryErrorText } from "@/lib/query/errorText"
import { forumKeys } from "./keys"
import { useSessionInfiniteQuery } from "@/lib/hooks/useSessionInfiniteQuery"

/**
 * Page size for a category's thread list. `ListThreadsQueryDto` caps `limit` at
 * 50, which is why this list pages rather than growing its limit — see below.
 */
export const FORUM_THREADS_PAGE_SIZE = 20

/**
 * A category's threads, paged (audit W3).
 *
 * This hook previously took a caller-supplied `limit` and the view implemented
 * "load more" as `setLimit(l => l + 20)`. That worked until A9 capped
 * `ListThreadsQueryDto.limit` at 50: the third click asked for 60, the global
 * ValidationPipe answered 400, and because the view never read `error` the
 * button simply stopped doing anything. Threads past the 40th were unreachable.
 *
 * Paging by `page` is what the API always exposed and what the query key was
 * already shaped for. `limit` is fixed here so no caller can re-open that hole.
 *
 * The end-of-list signal is the accumulated item count against the `total` the
 * API returns on every page — not a short page, which for this endpoint would
 * also be produced by a page of deleted-but-counted rows.
 *
 * 401s are handled centrally: if session is expired, the dialog appears and
 * user can re-authenticate. Pending 2FA 401s are silently ignored.
 */
export function useForumThreads(slug: string, params: { sort?: ThreadSort } = {}) {
  const { sort } = params

  const query = useSessionInfiniteQuery<ForumThreadList>({
    queryKey: forumKeys.threads(slug as any, {
      sort,
      limit: FORUM_THREADS_PAGE_SIZE,
    }) as any,
    initialPageParam: 1,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      orThrow(
        ForumService.getCategoryThreads(slug, {
          sort,
          page: pageParam,
          limit: FORUM_THREADS_PAGE_SIZE,
        }),
      ),
    getNextPageParam: (lastPage: ForumThreadList, allPages: ForumThreadList[]) =>
      nextPageParam(lastPage, allPages),
    enabled: Boolean(slug),
  } as any)

  const { fetchNextPage } = query
  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const pages = ((query.data as any)?.pages ?? []) as ForumThreadList[]

  return {
    threads: pages.flatMap((p) => p.items) as ForumThread[],
    // `total` is the server's count for the whole category, so the header keeps
    // showing the real size of the board rather than how much has been loaded.
    total: pages.length ? pages[0].total : 0,
    error: queryErrorText(query.error),
    isLoading: query.isLoading,
    refetch: query.refetch,
    hasMore: Boolean((query as any).hasNextPage),
    isLoadingMore: Boolean((query as any).isFetchingNextPage),
    loadMore,
  }
}

/**
 * Shared end-of-list rule for both forum lists.
 *
 * Exported for the test: the interesting cases are the boundary (loaded exactly
 * equals total, which must stop) and a `total` that shrinks under the reader
 * because a thread was deleted between pages, which must also stop rather than
 * page forever.
 */
export function nextPageParam(
  lastPage: { items: unknown[]; total: number },
  allPages: { items: unknown[] }[],
): number | undefined {
  const loaded = allPages.reduce((n, p) => n + p.items.length, 0)
  if (loaded >= lastPage.total) return undefined
  // A page that came back empty while `total` still claims more rows would
  // otherwise request the same offset forever.
  if (lastPage.items.length === 0) return undefined
  return allPages.length + 1
}
