/**
 * What a trip costs. **The server decides this, not the browser.**
 *
 * Until this existed the page computed the price and told StarBank what to charge, so a crafted
 * request rode anywhere for whatever it liked. The web keeps the same formula for the estimate
 * it shows before you board; what is charged is always recomputed here from the player's real
 * position and the real stop.
 *
 * Changing these constants changes what players are charged — keep
 * `apps/web/src/app/smartrotom/taxi/_utils/constants.ts` in step, or the quoted price and the
 * charged price drift apart. `GET /smartrotom/taxi/config` serves these so the web can stop
 * hardcoding them.
 */
export const MINIMUM_FARE = 100;
export const PRICE_PER_BLOCK = 0.5;

/** The concept every fare is written to the ledger with. A trip IS its transfer. */
export const TRIP_CONCEPT_PREFIX = 'Taxi a ';

/** A flat boarding fare plus distance. */
export function priceFor(distanceInBlocks: number): number {
  return Math.ceil(MINIMUM_FARE + distanceInBlocks * PRICE_PER_BLOCK);
}

/** Horizontal distance only: the fare is priced on the map, and Y is not on the map. */
export function distanceBetween(
  a: { x: number; z: number },
  b: { x: number; z: number },
): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/**
 * How close counts as "standing at the stop" when resolving an ambiguous teleport.
 *
 * The mod puts a passenger on the first standable block at or near the stop's stored point,
 * searching up to 4 blocks vertically, and a player can take a step before the position is
 * read back. Generous enough to cover both, tight enough that a player who never moved cannot
 * be mistaken for one who arrived — stops are far further apart than this.
 */
export const ARRIVAL_TOLERANCE_BLOCKS = 8;
