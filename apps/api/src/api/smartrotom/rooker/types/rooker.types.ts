// Domain types for Rooker. Local to the module on purpose — apps/api must never
// import @boffmedia/shared (it breaks `nest start`).

export type RookerPostType = 'text' | 'media' | 'capture' | 'battle';
export type RookerReactionType =
  | 'heart'
  | 'pokeball'
  | 'choque'
  | 'shiny'
  | 'fuego';

export const POST_TYPES: readonly RookerPostType[] = [
  'text',
  'media',
  'capture',
  'battle',
];

export const REACTION_TYPES: readonly RookerReactionType[] = [
  'heart',
  'pokeball',
  'choque',
  'shiny',
  'fuego',
];

export interface ReactionCounts {
  heart: number;
  pokeball: number;
  choque: number;
  shiny: number;
  fuego: number;
}

export const emptyReactionCounts = (): ReactionCounts => ({
  heart: 0,
  pokeball: 0,
  choque: 0,
  shiny: 0,
  fuego: 0,
});

export interface PostAuthor {
  uuid: string;
  username: string;
  handle: string | null;
  displayName: string | null;
  partnerPokemonId: number | null;
  isVerified: boolean;
}

export interface PostCounts {
  replies: number;
  retrinos: number;
  reactions: ReactionCounts;
}

export interface PostViewerState {
  reaction: RookerReactionType | null;
  retrino: boolean;
  bookmark: boolean;
}

export interface PostCapture {
  pokemonId: number;
  formId: string;
  paletteId: string;
  shiny: boolean;
  caughtAt: Date | null;
}

export interface PostBattle {
  replayId: number;
  side1: string;
  side2: string;
  winner: string | null;
  createdAt: Date | null;
}

export interface PostView {
  id: number;
  author: PostAuthor;
  text: string | null;
  type: RookerPostType;
  createdAt: Date | null;
  pinned: boolean;
  parentId: number | null;
  counts: PostCounts;
  me: PostViewerState;
  capture: PostCapture | null;
  battle: PostBattle | null;
  mediaUrl: string | null;
  retrinoBy: string | null;
}

export interface ProfileCounts {
  posts: number;
  followers: number;
  following: number;
}

// Derived from real data every time — nothing here is stored on the profile.
export interface TrainerStats {
  captures: number;
  shinies: number;
  battles: number;
  dexPct: number;
}

export interface ProfileView {
  uuid: string;
  username: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  link: string | null;
  partnerPokemonId: number | null;
  createdAt: Date | null;
  counts: ProfileCounts;
  stats: TrainerStats;
  isFollowedByMe: boolean;
}

export interface TrendItem {
  tag: string;
  posts: number;
}

export interface SuggestionItem {
  uuid: string;
  username: string;
  handle: string;
  displayName: string | null;
  partnerPokemonId: number | null;
  followers: number;
}

export interface SearchResult {
  users: SuggestionItem[];
  posts: PostView[];
  tags: TrendItem[];
}

// A post row as it surfaced in a feed: `surfacedAt` is the retrino timestamp when
// the row is in the timeline because a followee retrinoed it, otherwise the post's
// own createdAt. `retrinoByUuid` resolves to a handle during hydration.
export interface FeedRow {
  postId: number;
  surfacedAt: Date;
  retrinoByUuid: string | null;
}
