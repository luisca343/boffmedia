import { MINIMUM_FARE, PRICE_PER_BLOCK } from "./constants"

/** What the server charges: a flat boarding fare plus distance. */
export function priceFor(dist: number): number {
  return Math.ceil(MINIMUM_FARE + dist * PRICE_PER_BLOCK)
}

/**
 * The distance a past fare implies, inverted from `priceFor`. The ledger records what
 * a trip cost but not how far it went, and this is exact enough to total lifetime
 * blocks (the `ceil` above loses at most one block per trip).
 */
export function blocksFromFare(price: number): number {
  return Math.max(0, Math.round((price - MINIMUM_FARE) / PRICE_PER_BLOCK))
}

/** What a fare is made of — shown line by line before the player pays. */
export function fareBreakdown(dist: number) {
  const distanceFare = priceFor(dist) - MINIMUM_FARE
  return {
    base: MINIMUM_FARE,
    distanceFare,
    dist,
    total: MINIMUM_FARE + distanceFare,
  }
}
