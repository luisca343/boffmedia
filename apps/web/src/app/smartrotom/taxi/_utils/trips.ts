import type { StarBankTransaction } from "@boffmedia/shared"
import type { Trip } from "../_types"
import { TAXI_SERVICE_ACCOUNT } from "./constants"
import { blocksFromFare } from "./fare"

/** The concept every taxi fare is written to the ledger with — see `useTeleport`. */
export const TRIP_CONCEPT_PREFIX = "Taxi a "

/**
 * Trips, reconstructed from the StarBank ledger.
 *
 * The taxi keeps no trip table: a trip IS the transfer that paid for it. Every fare is
 * written with the concept `Taxi a <stop>` and paid INTO the taxi's service account, so
 * those two facts together recover the whole travel history — destination, price, when,
 * and (via the pricing formula) how far. This is what makes the passport real rather
 * than seeded.
 *
 * Direction is read off `to`, NOT off `isPayer`: the entity declares `isPayer`, but
 * `GET /starbank/transactions/user/:uuid` does not populate it (verified against the
 * live API — every row comes back without the field). Filtering on it silently matched
 * nothing and the passport always read zero.
 */
export function tripsFromTransactions(transactions: StarBankTransaction[]): Trip[] {
  return transactions
    .filter((tx) => tx.to === TAXI_SERVICE_ACCOUNT && tx.reason?.startsWith(TRIP_CONCEPT_PREFIX))
    .map((tx, i) => {
      const ts = new Date(tx.date).getTime()
      return {
        id: `${tx.date}-${i}`,
        stopId: tx.reason.slice(TRIP_CONCEPT_PREFIX.length),
        price: tx.amount,
        ts: Number.isFinite(ts) ? ts : 0,
        blocks: blocksFromFare(tx.amount),
      }
    })
    .sort((a, b) => b.ts - a.ts)
}

export interface TravelStats {
  trips: number
  spent: number
  blocks: number
  /** Stop ids the player has ever paid to reach — the passport's stamps. */
  visited: string[]
  /** Most recent distinct destinations, newest first. */
  recents: string[]
}

export function travelStats(trips: Trip[]): TravelStats {
  const visited: string[] = []
  for (const trip of trips) if (!visited.includes(trip.stopId)) visited.push(trip.stopId)
  return {
    trips: trips.length,
    spent: trips.reduce((sum, t) => sum + t.price, 0),
    blocks: trips.reduce((sum, t) => sum + t.blocks, 0),
    visited,
    // `trips` is newest-first, so first-seen order is already recency order.
    recents: visited.slice(0, 6),
  }
}
