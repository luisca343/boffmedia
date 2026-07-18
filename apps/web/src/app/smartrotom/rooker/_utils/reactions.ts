/**
 * The five reactions. Rooker keeps Twitter's like as the default tap and layers the
 * other four behind a hover tray — so a one-tap "me gusta" still works exactly as it
 * always did, and the Pixelmon vocabulary is an opt-in flourish on top.
 *
 * The class strings are full literals on purpose: a `text-rk-${type}` fragment is
 * invisible to the Tailwind JIT and would silently compile to nothing (§4, gap G2).
 */
export type ReactionType = "heart" | "pokeball" | "choque" | "shiny" | "fuego"

export interface ReactionCounts {
  heart: number
  pokeball: number
  choque: number
  shiny: number
  fuego: number
}

export const EMPTY_REACTIONS: ReactionCounts = { heart: 0, pokeball: 0, choque: 0, shiny: 0, fuego: 0 }

export interface ReactionSpec {
  type: ReactionType
  /** Colour when the reader has picked this reaction. */
  text: string
  /** The hover/active halo behind the glyph. */
  wash: string
  ring: string
}

export const REACTIONS: ReactionSpec[] = [
  { type: "heart",    text: "text-rk-heart",  wash: "bg-rk-heart/15",  ring: "ring-rk-heart/40" },
  { type: "pokeball", text: "text-rk-ball",   wash: "bg-rk-ball/15",   ring: "ring-rk-ball/40" },
  { type: "choque",   text: "text-rk-choque", wash: "bg-rk-choque/15", ring: "ring-rk-choque/40" },
  { type: "shiny",    text: "text-rk-shiny",  wash: "bg-rk-shiny/15",  ring: "ring-rk-shiny/40" },
  { type: "fuego",    text: "text-rk-fuego",  wash: "bg-rk-fuego/15",  ring: "ring-rk-fuego/40" },
]

export const REACTION_BY_TYPE: Record<ReactionType, ReactionSpec> = REACTIONS.reduce(
  (acc, r) => ({ ...acc, [r.type]: r }),
  {} as Record<ReactionType, ReactionSpec>,
)

export function totalReactions(counts: ReactionCounts | undefined): number {
  if (!counts) return 0
  return counts.heart + counts.pokeball + counts.choque + counts.shiny + counts.fuego
}

/**
 * The optimistic result of tapping `type` when `mine` is already set. The server
 * enforces the same rule (one reaction per reader per post, PK'd on (postId, uuid)):
 * tapping the one you already have removes it, tapping a different one moves it.
 */
export function applyReaction(
  counts: ReactionCounts,
  mine: ReactionType | null,
  type: ReactionType,
): { counts: ReactionCounts; mine: ReactionType | null } {
  const next = { ...counts }
  if (mine) next[mine] = Math.max(0, next[mine] - 1)
  if (mine === type) return { counts: next, mine: null }
  next[type] = next[type] + 1
  return { counts: next, mine: type }
}
