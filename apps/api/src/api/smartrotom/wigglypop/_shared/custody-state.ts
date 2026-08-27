/**
 * The delivery states an order line moves through, and the rule that decides
 * which of them a crashed attempt may be retried from.
 *
 * Every `-ndo` state is an INTENT marker: it is written before the game-server
 * call it names, and replaced the moment that call returns — success or failure
 * alike. So a line found sitting in one of them was interrupted mid-call by
 * something that never got to write again: a crash, an OOM kill, a lost pod.
 *
 * That distinction is the whole point. A call that RETURNS an error did not
 * land, and the saga rolls the marker back so the step can be retried safely. A
 * call that never returned is ambiguous, and the sweeper escalates it to
 * `revision` instead of guessing. Guessing wrong on a give mints a second
 * Pokémon; guessing wrong on a payout pays a seller twice.
 */
export const DELIVERY = {
  /** Nothing has been taken from the seller. */
  PENDING: 'pendiente',
  /** Intent: about to call takePokemon/takeItems. */
  TAKING: 'tomando',
  /** Goods are off the seller and in the market's hands; `takenPayload` is set. */
  TAKEN: 'tomado',
  /** Intent: about to hand the goods to the buyer. */
  GIVING: 'entregando',
  /** The buyer has the goods; the seller has not been paid yet. */
  GIVEN: 'entregado',
  /** Intent: about to release escrow to the seller. */
  PAYING: 'pagando',
  /** Delivered and paid. Terminal, happy. */
  CONFIRMED: 'confirmado',
  /** Intent: about to hand the goods back to the seller. */
  RESTORING: 'restaurando',
  /** Rolled back; the seller has their goods and the buyer their money. Terminal. */
  CANCELLED: 'cancelado',
  /** A human has to look. Terminal, unhappy — never reached automatically twice. */
  REVIEW: 'revision',
  /** Manual-custody only: the seller says they handed the goods over in-game. */
  TRANSFERRED: 'transferido',
} as const;

export type DeliveryState = (typeof DELIVERY)[keyof typeof DELIVERY];

/**
 * States that mean "a game-server or money call was in flight and we never
 * heard back". Finding one after the owning process is gone is unrecoverable
 * without a human, because the API cannot tell whether the call landed.
 */
export const IN_FLIGHT: readonly string[] = [
  DELIVERY.TAKING,
  DELIVERY.GIVING,
  DELIVERY.PAYING,
  DELIVERY.RESTORING,
];

/** Nothing more will happen to a line in one of these. */
export const TERMINAL: readonly string[] = [
  DELIVERY.CONFIRMED,
  DELIVERY.CANCELLED,
  DELIVERY.REVIEW,
];

/**
 * Why a line needs a human, recorded on the order so the review queue explains
 * itself without anyone having to reconstruct it from logs.
 */
export type ReviewReason =
  | 'take-interrupted'
  | 'give-interrupted'
  | 'payout-interrupted'
  | 'restore-interrupted'
  | 'give-exhausted'
  | 'payout-exhausted'
  | 'restore-failed';
