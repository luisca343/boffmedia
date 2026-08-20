import type { RookerAuthor } from "@/app/smartrotom/rooker/_types"
import type { ReactionCounts } from "@/app/smartrotom/rooker/_utils/reactions"

/**
 * Specimen data for the Rooker chapters.
 *
 * The showcase is the one place a fixture is legitimate — it documents the component,
 * not the product, and it has to render identically on every machine. The app itself
 * ships no mock content at all.
 *
 * The uuid is a real, stable Minecraft account (Notch), so the avatar specimen resolves
 * a genuine head render through the same `mc-heads.net` path the app uses, instead of
 * falling back to the initial and hiding a bug in the real path.
 */
export const RK_DEMO_AUTHOR: RookerAuthor = {
  uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  username: "Notch",
  handle: "notch",
  displayName: "Notch",
  partnerPokemonId: 25,
  isVerified: false,
}

export const RK_DEMO_REACTIONS: ReactionCounts = {
  heart: 2100,
  pokeball: 410,
  choque: 230,
  shiny: 3800,
  fuego: 90,
}
