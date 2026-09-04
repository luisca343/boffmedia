import { queryKey } from "@/lib/query/keys"
import type { ListPostsParams, ListThreadsParams } from "@/services/api/boffmedia/forumService"

/**
 * Query keys for the forum domain. Shape is `[domain, resource, ...ids,
 * params?]` — see `lib/query/keys.ts`.
 *
 * `threads` keys the category slug as an id and sort/page/limit as params, so
 * `invalidateQueries({ queryKey: ["forum", "threads", slug] })` after a new
 * thread refreshes every page and sort of that category at once.
 */
export const forumKeys = {
  all: () => ["forum"] as const,
  categories: () => queryKey("forum", "categories"),
  category: (slug: string) => queryKey("forum", "category", [slug]),
  threads: (slug: string, params?: ListThreadsParams) =>
    queryKey("forum", "threads", [slug], params),
  thread: (id: number) => queryKey("forum", "thread", [id]),
  posts: (threadId: number, params?: ListPostsParams) =>
    queryKey("forum", "posts", [threadId], params),
  stats: () => queryKey("forum", "stats"),
  online: () => queryKey("forum", "online"),
} as const
