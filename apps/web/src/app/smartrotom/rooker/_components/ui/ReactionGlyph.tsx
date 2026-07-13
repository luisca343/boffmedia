import { Icon } from "./Icon"
import { PokeBall } from "./PokeBall"
import { REACTION_BY_TYPE, type ReactionType } from "../../_utils/reactions"

/**
 * One reaction, drawn.
 *
 * `active` is what fills the glyph and paints it its own colour; inactive it is a
 * hollow stroke in `currentColor`, so it inherits the hover tint of whatever button
 * it sits in. The Poké Ball is the exception — it is a colour illustration, not a
 * monochrome glyph, so it never inherits.
 */
export interface ReactionGlyphProps {
  type: ReactionType
  size?: number
  active?: boolean
  className?: string
}

export function ReactionGlyph({ type, size = 20, active = false, className = "" }: ReactionGlyphProps) {
  if (type === "pokeball") return <PokeBall size={size} variant="ball-poke" className={className} />

  const tint = active ? REACTION_BY_TYPE[type].text : ""
  const name = type === "heart" ? "heart" : type === "choque" ? "bolt" : type === "shiny" ? "sparkle" : "flame"

  return <Icon name={name} size={size} fill={active} className={`${tint} ${className}`} />
}
