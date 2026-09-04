import type { GameState, PackEntry } from "../services/types"

/** WHY an account action is refused right now — not a bare boolean, because the
 *  two cases need different copy. "Wait for the install to finish" names a job
 *  that ends on its own; "close the game first" names one the player has to end
 *  themselves. A single "busy" string would be wrong for one of them. */
export type SessionBusyReason = "installing" | "playing"

/** The ONE predicate every account action asks, kept pure and out of the
 *  provider so the invariant is testable without a DOM.
 *
 *  The trap it exists for: `boff_switch` REPLACES the bearer token Rust
 *  authenticates with, process-wide. Swap it under a running install and every
 *  remaining request of that install re-authenticates as somebody else, 401s,
 *  and the instance is left half-written on disk. `auth_logout` is worse — it
 *  forgets the session outright (`api.forget_session`), so there is no token at
 *  all for the rest of the download.
 *
 *  Install before game on purpose: when both are true the install is the one
 *  that leaves damage behind, so it is the one the notice should name. */
export function sessionBusyReason(
  game: GameState,
  packs: readonly PackEntry[],
): SessionBusyReason | null {
  // `state` is non-optional in the type, but a pack row assembled from a stale
  // cache has reached here without one; an optional read is cheaper than the
  // crash.
  if (packs.some((p) => p.state?.kind === "installing")) return "installing"
  if (game.kind === "running" || game.kind === "preparing") return "playing"
  return null
}
