import {
  rotomGETOrThrow,
  rotomAuthedPOSTOrThrow,
  rotomAuthedPATCHOrThrow,
  rotomAuthedDELETEOrThrow,
} from "@/services/boffAPI"

// Reads stay anonymous (the timeline is public). Writes carry the Bearer: the
// API takes the acting player from the token now, so the `uuid` still sent in
// these bodies is ignored server-side.

/**
 * Rooker — the social nest.
 *
 * Every non-GET here goes through `rotomPOST/PATCH/DELETE`, which inject
 * `body.server = MC_WORLD`; without it `MinecraftMiddleware` 403s the call.
 * Do not hand-roll a `fetch` against these routes.
 *
 * Note the envelopes: every *list* route answers `{ items, … }`, never a bare array —
 * the feed is paged and had to carry `hasMore`, and the rest followed for consistency.
 * The hooks unwrap `.items`, so screens still see plain arrays.
 *
 * The types mirror the API's entities in `app/smartrotom/rooker/_types` rather than
 * importing from `@boffmedia/shared`, so the timeline compiles before the next
 * `pnpm generate:shared` run.
 */
import type {
  FeedTab,
  ProfileTab,
  RookerFeed,
  RookerFollowResult,
  RookerNotification,
  RookerPost,
  RookerPostDetail,
  RookerProfile,
  RookerSearchResults,
  RookerSuggestion,
  RookerTrend,
} from "@/app/smartrotom/rooker/_types"
import type { ReactionType } from "@/app/smartrotom/rooker/_utils/reactions"

export interface CreatePostBody {
  uuid: string
  text?: string
  type: RookerPost["type"]
  parentId?: number
  mediaUrl?: string
  captureId?: number
  replayId?: number
}

export interface UpdateProfileBody {
  uuid: string
  handle?: string
  displayName?: string
  bio?: string
  link?: string
  partnerPokemonId?: number | null
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.append(k, String(v))
  }
  const s = search.toString()
  return s ? `?${s}` : ""
}

export class RookerService {
  // ── Timeline ───────────────────────────────────────────────────────────────
  static getFeed(params: {
    uuid?: string
    tab?: FeedTab
    limit?: number
    offset?: number
  }): Promise<RookerFeed> {
    return rotomGETOrThrow<RookerFeed>(`/rooker/feed${qs(params)}`)
  }

  static getPost(id: number, uuid?: string): Promise<RookerPostDetail> {
    return rotomGETOrThrow<RookerPostDetail>(`/rooker/posts/${id}${qs({ uuid })}`)
  }

  static createPost(body: CreatePostBody): Promise<RookerPost> {
    return rotomAuthedPOSTOrThrow<RookerPost>("/rooker/posts", body)
  }

  static deletePost(id: number, uuid: string): Promise<{ ok: boolean; id: number }> {
    return rotomAuthedDELETEOrThrow<{ ok: boolean; id: number }>(`/rooker/posts/${id}`, { uuid })
  }

  // ── Engagement. All three toggle, and all three answer with the whole post,
  //    so the caller never has to reconstruct the new counts itself. ──────────
  static react(id: number, uuid: string, type: ReactionType): Promise<RookerPost> {
    return rotomAuthedPOSTOrThrow<RookerPost>(`/rooker/posts/${id}/react`, { uuid, type })
  }

  static retrino(id: number, uuid: string): Promise<RookerPost> {
    return rotomAuthedPOSTOrThrow<RookerPost>(`/rooker/posts/${id}/retrino`, { uuid })
  }

  static bookmark(id: number, uuid: string): Promise<RookerPost> {
    return rotomAuthedPOSTOrThrow<RookerPost>(`/rooker/posts/${id}/bookmark`, { uuid })
  }

  static getBookmarks(uuid: string): Promise<RookerFeed> {
    return rotomGETOrThrow<RookerFeed>(`/rooker/bookmarks${qs({ uuid })}`)
  }

  // ── The social graph ───────────────────────────────────────────────────────
  /**
   * The reader's own profile. Needed because the session carries a uuid and every
   * profile route is addressed by *handle* — and the two do not map 1:1 (the seeder
   * suffixes colliding handles), so it has to be asked for, not derived.
   * Resolves to `null` for a trainer with no Rooker profile yet.
   */
  static getMe(uuid: string): Promise<RookerProfile | null> {
    return rotomGETOrThrow<RookerProfile | null>(`/rooker/me${qs({ uuid })}`)
  }

  static follow(uuid: string, targetUuid: string): Promise<RookerFollowResult> {
    return rotomAuthedPOSTOrThrow<RookerFollowResult>("/rooker/follow", { uuid, targetUuid })
  }

  static getProfile(handle: string, viewer?: string): Promise<RookerProfile> {
    return rotomGETOrThrow<RookerProfile>(`/rooker/profile/${handle}${qs({ viewer })}`)
  }

  static getProfilePosts(
    handle: string,
    params: { tab?: ProfileTab; uuid?: string } = {},
  ): Promise<RookerFeed> {
    return rotomGETOrThrow<RookerFeed>(`/rooker/profile/${handle}/posts${qs(params)}`)
  }

  static updateProfile(body: UpdateProfileBody): Promise<RookerProfile> {
    return rotomAuthedPATCHOrThrow<RookerProfile>("/rooker/profile", body)
  }

  // ── Discovery ──────────────────────────────────────────────────────────────
  static getTrends(limit = 6): Promise<{ items: RookerTrend[] }> {
    return rotomGETOrThrow<{ items: RookerTrend[] }>(`/rooker/trends${qs({ limit })}`)
  }

  static getSuggestions(uuid?: string, limit = 3): Promise<{ items: RookerSuggestion[] }> {
    return rotomGETOrThrow<{ items: RookerSuggestion[] }>(`/rooker/suggestions${qs({ uuid, limit })}`)
  }

  static search(q: string, uuid?: string): Promise<RookerSearchResults> {
    return rotomGETOrThrow<RookerSearchResults>(`/rooker/search${qs({ q, uuid })}`)
  }

  /** Rides on the generic `rotom_notifications` table, filtered to `type = 'rooker'`. */
  static getNotifications(
    uuid: string,
  ): Promise<{ items: RookerNotification[]; total: number }> {
    return rotomGETOrThrow<{ items: RookerNotification[]; total: number }>(`/rooker/notifications${qs({ uuid })}`)
  }
}
