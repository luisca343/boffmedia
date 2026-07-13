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
export interface RookerAuthor {
  uuid: string
  username: string
  /**
   * Null until the trainer has a Rooker profile. Every existing `rotom_user` is
   * seeded with one, but a player who joins the server tomorrow appears in the graph
   * before they appear in Rooker — so the timeline must render a handle-less author
   * rather than crash on one.
   */
  handle: string | null
  displayName: string | null
  partnerPokemonId: number | null
  /**
   * [deferred] Staff/gym-leader verification. `rotom_users` has no role column and the
   * boffmedia role join is not wired, so the API pins this to `false` and the check
   * never renders. See docs/smartrotom/deferred/README.md.
   */
  isVerified?: boolean
}

export interface RookerCapture {
  pokemonId: number
  formId: string
  paletteId: string
  /** Derived server-side: a palette other than `none` IS the shiny flag. */
  shiny: boolean
  caughtAt: string | null
}

export interface RookerBattle {
  replayId: number
  side1: string
  side2: string
  winner: string | null
  createdAt: string
}

export interface RookerPostCounts {
  replies: number
  retrinos: number
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

export interface RookerPost {
  id: number
  author: RookerAuthor
  text: string | null
  type: PostType
  createdAt: string
  pinned: boolean
  parentId: number | null
  counts: RookerPostCounts
  me: RookerPostMe
  capture: RookerCapture | null
  battle: RookerBattle | null
  mediaUrl: string | null
  /** Set when the post surfaced because someone the reader follows retrinoed it. */
  retrinoBy: string | null
}

export interface RookerPostDetail {
  post: RookerPost
  replies: RookerPost[]
}

/** The API pages every post list. `hasMore` drives "load more"; it is not a count. */
export interface RookerFeed {
  items: RookerPost[]
  hasMore: boolean
}

export interface RookerProfile {
  uuid: string
  username: string
  handle: string
  displayName: string | null
  bio: string | null
  link: string | null
  partnerPokemonId: number | null
  createdAt: string
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
  isFollowedByMe: boolean
}

export interface RookerTrend {
  tag: string
  posts: number
}

/** The state AFTER the toggle, so the caller never has to guess which way it flipped. */
export interface RookerFollowResult {
  following: boolean
  followers: number
}

export interface RookerSuggestion {
  uuid: string
  username: string
  handle: string
  displayName: string | null
  partnerPokemonId: number | null
  followers: number
  isVerified?: boolean
}

export interface RookerSearchResults {
  users: RookerSuggestion[]
  posts: RookerPost[]
  tags: RookerTrend[]
}

export interface RookerNotification {
  id: number
  userUuid: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: number
  createdAt: string
}

export type ProfileTab = "trinos" | "capturas" | "combates" | "media"
export type FeedTab = "parati" | "siguiendo"
