"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RookerService, type CreatePostBody, type UpdateProfileBody } from "@/services/api/smartrotom/rookerService"
import { useBoffSession } from "@/services/useBoffSession"
import type { FeedTab, ProfileTab, RookerPost, RookerPostDetail } from "../_types"
import { applyReaction, type ReactionType } from "../_utils/reactions"

/** The SmartRotom uuid every Rooker endpoint is keyed by. `null` until signed in. */
export function useRookerUuid(): string | null {
  const { session } = useBoffSession()
  return session?.user?.smartRotomUser?.uuid ?? null
}

/**
 * `boffAPI` has two failure modes: network errors throw, HTTP errors resolve to
 * `{ success: false }`. Reading `.data` off an unchecked response is the silent-failure
 * pattern the audit flagged (§8), so every call funnels through here.
 */
async function unwrap<T>(call: Promise<{ success: boolean; data?: T; message?: string }>): Promise<T> {
  const res = await call
  if (!res.success || res.data === undefined) {
    throw new Error(res.message || "El nido no responde")
  }
  return res.data
}

export const rookerKeys = {
  all: ["rooker"] as const,
  me: (uuid?: string | null) => ["rooker", "me", uuid] as const,
  feed: (tab: FeedTab, uuid?: string | null) => ["rooker", "feed", tab, uuid] as const,
  post: (id: number, uuid?: string | null) => ["rooker", "post", id, uuid] as const,
  profile: (handle: string, viewer?: string | null) => ["rooker", "profile", handle, viewer] as const,
  profilePosts: (handle: string, tab: ProfileTab, uuid?: string | null) =>
    ["rooker", "profile", handle, "posts", tab, uuid] as const,
  trends: () => ["rooker", "trends"] as const,
  suggestions: (uuid?: string | null) => ["rooker", "suggestions", uuid] as const,
  search: (q: string, uuid?: string | null) => ["rooker", "search", q, uuid] as const,
  notifications: (uuid: string) => ["rooker", "notifications", uuid] as const,
  bookmarks: (uuid: string) => ["rooker", "bookmarks", uuid] as const,
}

// ── Reads ────────────────────────────────────────────────────────────────────

/**
 * The reader's own profile — their handle, their avatar, their counts. The nav chip and
 * every "go to my profile" link depend on it, so it is fetched once and cached long:
 * it changes only when the reader edits it, and that invalidates the namespace anyway.
 */
export function useMe() {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.me(uuid),
    queryFn: () => unwrap(RookerService.getMe(uuid!)),
    enabled: Boolean(uuid),
    staleTime: 5 * 60_000,
  })
}

export function useFeed(tab: FeedTab) {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.feed(tab, uuid),
    queryFn: async () => (await unwrap(RookerService.getFeed({ uuid: uuid ?? undefined, tab }))).items,
    // "Siguiendo" is empty and meaningless for a signed-out reader — there is no
    // graph to follow — so it is only fetched once we know who is asking.
    enabled: tab === "parati" || Boolean(uuid),
  })
}

export function usePost(id: number) {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.post(id, uuid),
    queryFn: () => unwrap(RookerService.getPost(id, uuid ?? undefined)),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useProfile(handle: string) {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.profile(handle, uuid),
    queryFn: () => unwrap(RookerService.getProfile(handle, uuid ?? undefined)),
    enabled: Boolean(handle),
  })
}

export function useProfilePosts(handle: string, tab: ProfileTab) {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.profilePosts(handle, tab, uuid),
    queryFn: async () =>
      (await unwrap(RookerService.getProfilePosts(handle, { tab, uuid: uuid ?? undefined }))).items,
    enabled: Boolean(handle),
  })
}

export function useTrends(limit = 6) {
  return useQuery({
    queryKey: rookerKeys.trends(),
    queryFn: async () => (await unwrap(RookerService.getTrends(limit))).items,
  })
}

export function useSuggestions(limit = 3) {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.suggestions(uuid),
    queryFn: async () => (await unwrap(RookerService.getSuggestions(uuid ?? undefined, limit))).items,
  })
}

export function useSearch(q: string) {
  const uuid = useRookerUuid()
  const term = q.trim()
  return useQuery({
    queryKey: rookerKeys.search(term, uuid),
    queryFn: () => unwrap(RookerService.search(term, uuid ?? undefined)),
    enabled: term.length >= 2,
  })
}

export function useNotifications() {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.notifications(uuid ?? ""),
    queryFn: async () => (await unwrap(RookerService.getNotifications(uuid!))).items,
    enabled: Boolean(uuid),
  })
}

export function useBookmarks() {
  const uuid = useRookerUuid()
  return useQuery({
    queryKey: rookerKeys.bookmarks(uuid ?? ""),
    queryFn: async () => (await unwrap(RookerService.getBookmarks(uuid!))).items,
    enabled: Boolean(uuid),
  })
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Rewrites one post wherever it currently sits in the cache — both feed tabs, every
 * profile tab, the detail view and its reply list. A reaction fired from the timeline
 * has to move the same counter the detail view is showing, and they are separate
 * cache entries; without this the two disagree until a refetch.
 */
function patchPostEverywhere(
  qc: ReturnType<typeof useQueryClient>,
  id: number,
  patch: (post: RookerPost) => RookerPost,
) {
  qc.setQueriesData<RookerPost[]>({ queryKey: rookerKeys.all }, (list) => {
    if (!Array.isArray(list)) return list
    if (!list.some((p) => p?.id === id)) return list
    return list.map((p) => (p.id === id ? patch(p) : p))
  })
  qc.setQueriesData<RookerPostDetail>({ queryKey: rookerKeys.all }, (detail) => {
    if (!detail || Array.isArray(detail) || !detail.post) return detail
    const post = detail.post.id === id ? patch(detail.post) : detail.post
    const replies = detail.replies?.some((r) => r.id === id)
      ? detail.replies.map((r) => (r.id === id ? patch(r) : r))
      : detail.replies
    if (post === detail.post && replies === detail.replies) return detail
    return { post, replies }
  })
}

/**
 * Reacting is optimistic: the glyph fills and the counter moves on the tap, because a
 * round-trip's worth of dead time is exactly what makes a timeline feel broken. The
 * server is the authority on the final counts, so its response overwrites ours; on
 * failure we roll back to the snapshot.
 */
export function useReact() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: ReactionType }) =>
      unwrap(RookerService.react(id, uuid!, type)),
    onMutate: async ({ id, type }) => {
      await qc.cancelQueries({ queryKey: rookerKeys.all })
      const snapshot = qc.getQueriesData({ queryKey: rookerKeys.all })
      patchPostEverywhere(qc, id, (post) => {
        const { counts, mine } = applyReaction(post.counts.reactions, post.me?.reaction ?? null, type)
        return {
          ...post,
          counts: { ...post.counts, reactions: counts },
          me: { reaction: mine, retrino: post.me?.retrino ?? false, bookmark: post.me?.bookmark ?? false },
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSuccess: (server) => patchPostEverywhere(qc, server.id, () => server),
  })
}

export function useRetrino() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unwrap(RookerService.retrino(id, uuid!)),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: rookerKeys.all })
      const snapshot = qc.getQueriesData({ queryKey: rookerKeys.all })
      patchPostEverywhere(qc, id, (post) => {
        const on = !(post.me?.retrino ?? false)
        return {
          ...post,
          counts: { ...post.counts, retrinos: Math.max(0, post.counts.retrinos + (on ? 1 : -1)) },
          me: { reaction: post.me?.reaction ?? null, retrino: on, bookmark: post.me?.bookmark ?? false },
        }
      })
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSuccess: (server) => patchPostEverywhere(qc, server.id, () => server),
  })
}

export function useBookmark() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unwrap(RookerService.bookmark(id, uuid!)),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: rookerKeys.all })
      const snapshot = qc.getQueriesData({ queryKey: rookerKeys.all })
      patchPostEverywhere(qc, id, (post) => ({
        ...post,
        me: {
          reaction: post.me?.reaction ?? null,
          retrino: post.me?.retrino ?? false,
          bookmark: !(post.me?.bookmark ?? false),
        },
      }))
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSuccess: (server) => patchPostEverywhere(qc, server.id, () => server),
    onSettled: () => {
      if (uuid) void qc.invalidateQueries({ queryKey: rookerKeys.bookmarks(uuid) })
    },
  })
}

/**
 * A new trino invalidates the whole namespace rather than being spliced in: a reply
 * moves its parent's counter, a top-level post moves the feed AND the author's profile
 * tabs, and a hashtag in it moves the trends. Splicing each of those by hand is how the
 * counts drift.
 */
export function useCreatePost() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<CreatePostBody, "uuid">) => unwrap(RookerService.createPost({ ...body, uuid: uuid! })),
    onSuccess: () => qc.invalidateQueries({ queryKey: rookerKeys.all }),
  })
}

export function useDeletePost() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unwrap(RookerService.deletePost(id, uuid!)),
    onSuccess: () => qc.invalidateQueries({ queryKey: rookerKeys.all }),
  })
}

/** Follow moves the target's follower count, the reader's following count, the
 *  suggestions list and the "Siguiendo" feed — so it invalidates rather than splices. */
export function useFollow() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetUuid: string) => unwrap(RookerService.follow(uuid!, targetUuid)),
    onSuccess: () => qc.invalidateQueries({ queryKey: rookerKeys.all }),
  })
}

export function useUpdateProfile() {
  const uuid = useRookerUuid()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<UpdateProfileBody, "uuid">) =>
      unwrap(RookerService.updateProfile({ ...body, uuid: uuid! })),
    onSuccess: () => qc.invalidateQueries({ queryKey: rookerKeys.all }),
  })
}
