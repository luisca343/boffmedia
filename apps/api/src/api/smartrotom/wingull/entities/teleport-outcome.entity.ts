/**
 * What the mod's `POST /taxi/teleport` answered.
 *
 * The mod's half is all-or-nothing — it validates the stop, the player and the arrival before it
 * moves anyone — and it distinguishes its failures by status code on purpose. Flattening that to
 * a boolean is what made the taxi unable to tell "this will never work" from "try again", so the
 * reason is carried all the way up to the caller that decides whether to charge.
 */
export type TeleportReason =
  /** 422 — the player is not on the server. Nothing happened. */
  | 'offline'
  /** 404 — no such stop; it was deleted between the list being cached and the trip. */
  | 'unknown_stop'
  /** 409 — nowhere safe to put the player down at that stop. */
  | 'unsafe_arrival'
  /** 409 — the player is inside a dungeon run, which owns where its party stands. */
  | 'in_dungeon_run'
  /**
   * 503, a timeout, or an unreachable server. AMBIGUOUS: the mod may or may not have moved the
   * player, so this is the one reason a caller must resolve by reading the position back rather
   * than assuming nothing happened.
   */
  | 'unresolved'
  /** 401 — bad or missing mod token. Not the player's fault. */
  | 'unauthorized';

export type TeleportOutcome =
  | { ok: true }
  | { ok: false; reason: TeleportReason; status: number; message: string };
