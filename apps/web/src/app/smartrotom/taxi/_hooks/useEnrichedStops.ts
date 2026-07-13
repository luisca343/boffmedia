"use client"

import { useMemo } from "react"
import type { Region, TaxiStop } from "@boffmedia/shared"
import type { EnrichedStop, Position } from "../_types"
import { priceFor } from "../_utils/fare"
import { bearing, distance, regionForPoint } from "../_utils/geo"

/**
 * Every stop, priced and oriented against where the player is standing right now.
 * Distance, fare and bearing all move with the player, so they are derived here rather
 * than stored — one memo instead of a recompute in each of the four surfaces that
 * needs them.
 */
export function useEnrichedStops(stops: TaxiStop[], player: Position, regions: Region[]): EnrichedStop[] {
  // Region lookup is O(stops × regions × vertices) and the world has hundreds of
  // regions, so it is keyed to the stops rather than the player's every step.
  const stopRegions = useMemo(() => {
    const map: Record<string, string | undefined> = {}
    for (const stop of stops) map[stop.id] = regionForPoint(stop.x, stop.z, regions)
    return map
  }, [stops, regions])

  return useMemo(
    () =>
      stops.map((stop) => {
        const dist = distance(player.x, player.z, stop.x, stop.z)
        return {
          ...stop,
          dist,
          price: priceFor(dist),
          bearing: bearing(player.x, player.z, stop.x, stop.z),
          region: stopRegions[stop.id],
        }
      }),
    [stops, player, stopRegions],
  )
}
