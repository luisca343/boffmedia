import type {
  RookerFeedEntity,
  RookerFollowResultEntity,
  RookerNotificationEntity,
  RookerPostAuthorEntity,
  RookerPostBattleEntity,
  RookerPostCaptureEntity,
  RookerPostCountsEntity,
  RookerPostEntity,
  RookerProfileEntity,
  RookerSearchEntity,
  RookerSuggestionEntity,
  RookerTrendEntity,
} from "@boffmedia/shared"
import type { ReactionCounts, ReactionType } from "../_utils/reactions"

export type PostType = "text" | "media" | "capture" | "battle"

/**
 * A trainer as the timeline shows them.
 *
 * The avatar is NOT stored: it is `f(uuid)` through Crafatar, because a SmartRotom
 * user is a Minecraft account and their skin is already their face everywhere else on
 * the server. What the reader *chooses* is `partnerPokemonId` — the Pokémon that
 * tints their profile banner and rides beside their name. It is validated against
 * their own Pokédex, so it is a real capture, not a costume.
 */
export interface RookerAuthor
  extends Omit<RookerPostAuthorEntity, "handle" | "displayName" | "partnerPokemonId"> {
  /**
   * Null until the trainer has a Rooker profile. Every existing `rotom_user` is
   * seeded with one, but a player who joins the server tomorrow appears in the graph
   * before they appear in Rooker — so the timeline must render a handle-less author
   * rather than crash on one.
   */
  handle: string | null
  displayName: string | null
  partnerPokemonId: number | null
}

export interface RookerCapture extends Omit<RookerPostCaptureEntity, "caughtAt"> {
  caughtAt: string | null
}

export interface RookerBattle extends Omit<RookerPostBattleEntity, "winner" | "createdAt"> {
  winner: string | null
  /**
   * TODO(P9): real drift, fixed here — the wire's `createdAt` is `Date | null` (a battle whose
   * replay predates the join, or import gaps). This type used to claim it was always a string;
   * `BattleCard.tsx`'s `relTime()` call was already null-safe, so no consumer needed a change.
   */
  createdAt: string | null
}

export interface RookerPostCounts extends Omit<RookerPostCountsEntity, "reactions"> {
  reactions: ReactionCounts
}

/**
 * What the *reader* has done to this post. Always present — the API defaults it to
 * all-false rather than omitting it, so no call site has to guard.
 */
export interface RookerPostMe {
  reaction: ReactionType | null
  retrino: boolean
  bookmark: boolean
}

export interface RookerPost
  extends Omit<
    RookerPostEntity,
    "author" | "text" | "type" | "createdAt" | "parentId" | "counts" | "me" | "capture" | "battle" | "mediaUrl" | "retrinoBy"
  > {
  author: RookerAuthor
  text: string | null
  /** Same values as the generated `RookerPostEntity.type` enum, restated as a plain union. */
  type: PostType
  /**
   * TODO(P9): real drift, fixed here — the wire's `createdAt` is `Date | null`, not always a
   * string. `AuthorLine.tsx` (the one place a post's `createdAt` reaches a typed prop) is
   * updated to accept `string | null`; its `relTime()`/`dateTime` use were already null-safe.
   */
  createdAt: string | null
  parentId: number | null
  counts: RookerPostCounts
  me: RookerPostMe
  capture: RookerCapture | null
  battle: RookerBattle | null
  mediaUrl: string | null
  /** Set when the post surfaced because someone the reader follows retrinoed it. */
  retrinoBy: string | null
}

// Same shape as generated `RookerThreadEntity` — spelled out rather than aliased so its two
// fields stay the app's own (already-aligned) `RookerPost`, not the raw entity.
export interface RookerPostDetail {
  post: RookerPost
  replies: RookerPost[]
}

/** The API pages every post list. `hasMore` drives "load more"; it is not a count. */
export interface RookerFeed extends Omit<RookerFeedEntity, "items"> {
  items: RookerPost[]
}

export interface RookerProfile
  extends Omit<RookerProfileEntity, "displayName" | "bio" | "link" | "partnerPokemonId" | "createdAt" | "counts" | "stats"> {
  displayName: string | null
  bio: string | null
  link: string | null
  partnerPokemonId: number | null
  /** TODO(P9): real drift, fixed here — the wire's `createdAt` is `Date | null`; `joinedAt()`
   * (the only reader, in `[handle]/page.tsx`) was already null-safe. */
  createdAt: string | null
  /**
   * [deferred] Same staff/gym-leader verification as `RookerAuthor.isVerified` — not on the
   * profile entity itself, only on the post-author embed, but the check is inert everywhere
   * (always pinned `false` server-side), so the shape is restated here rather than plumbed
   * through a real join. See `_components/ui/Verified.tsx`.
   */
  isVerified?: boolean
  counts: {
    posts: number
    followers: number
    following: number
  }
  /** Derived from the Pokédex registry and the replay log — never invented. */
  stats: {
    captures: number
    shinies: number
    battles: number
    dexPct: number
  }
}

export type RookerTrend = RookerTrendEntity

/** The state AFTER the toggle, so the caller never has to guess which way it flipped. */
export type RookerFollowResult = RookerFollowResultEntity

export interface RookerSuggestion
  extends Omit<RookerSuggestionEntity, "displayName" | "partnerPokemonId"> {
  displayName: string | null
  partnerPokemonId: number | null
  /** [deferred] see `RookerProfile.isVerified` — not on the wire suggestion either. */
  isVerified?: boolean
}

export interface RookerSearchResults extends Omit<RookerSearchEntity, "users" | "posts" | "tags"> {
  users: RookerSuggestion[]
  posts: RookerPost[]
  tags: RookerTrend[]
}

export interface RookerNotification extends Omit<RookerNotificationEntity, "link" | "createdAt"> {
  link: string | null
  /** The wire's `createdAt` is nullable (`Date | null`); `relTime()` already guards it. */
  createdAt: string | null
}

export type ProfileTab = "trinos" | "capturas" | "combates" | "media"
export type FeedTab = "parati" | "siguiendo"
