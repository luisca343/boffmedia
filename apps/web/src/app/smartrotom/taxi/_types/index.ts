import type { TaxiStop } from "@boffmedia/shared"

export interface Position {
  x: number
  z: number
}

/**
 * What `POST /smartrotom/taxi/trip` answers. [deferred] Local until the next
 * `pnpm generate:shared` picks the API's TripResult/TaxiConfig up into @boffmedia/shared.
 */
export interface TripResult {
  stopId: string
  price: number
  distance: number
  transactionId: number
  /** The mod never confirmed the teleport; the trip was settled by reading the position back. */
  confirmedByPosition: boolean
}

/** The fare model, served by the API so the estimate and the charge cannot drift apart. */
export interface TaxiConfig {
  minimumFare: number
  pricePerBlock: number
  /** The account fares are paid into. Read, never hardcoded — it is seeded, not fixed. */
  serviceAccountId: number
  tripConceptPrefix: string
}

/**
 * A stop with everything the UI needs, computed against the player's live position.
 * `region` comes from the world's real WorldGuard polygons (see `_utils/geo.ts`) and
 * is absent for a stop that sits outside every region.
 */
export interface EnrichedStop extends TaxiStop {
  dist: number
  price: number
  bearing: number
  region?: string
}

/**
 * One taxi trip, reconstructed from the StarBank ledger — the taxi has no trip table
 * of its own. Every fare is a transfer whose concept reads `Taxi a <stop>`, so the
 * ledger IS the trip history (see `_utils/trips.ts`).
 */
export interface Trip {
  id: string
  stopId: string
  price: number
  ts: number
  /** Distance the fare implies, inverted from the pricing formula. */
  blocks: number
}
