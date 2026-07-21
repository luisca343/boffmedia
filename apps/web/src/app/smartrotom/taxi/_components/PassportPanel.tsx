"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Empty, Eyebrow, Icon, Skeleton, StatBox } from "./ui"
import { formatMoney, formatNum, relativeTime } from "../_utils/format"
import type { EnrichedStop, Trip } from "../_types"
import type { TravelStats } from "../_utils/trips"

/**
 * Pasaporte — the player's travel record.
 *
 * Every figure here is REAL: the taxi keeps no stats table, so all of it is derived from
 * the StarBank ledger (each fare is a transfer concept'd `Taxi a <stop>`). Nothing is
 * seeded. The handoff's frequent-rider tier, streak and achievements are NOT here — they
 * would need a rewards backend that does not exist, and are registered as deferred.
 */
/**
 * Distance travelled, in the unit that keeps it honest. Rounding 538 blocks to "1 k b"
 * is a lie the moment a player has taken one short trip, so thousands only appear once
 * there are thousands.
 */
function blocksTravelled(blocks: number): { value: string; suffix: string } {
  if (blocks < 1000) return { value: String(Math.round(blocks)), suffix: " b" }
  return { value: (blocks / 1000).toFixed(1).replace(".", ","), suffix: " k b" }
}

export function PassportPanel({
  stops,
  trips,
  stats,
  loading,
}: {
  stops: EnrichedStop[]
  trips: Trip[]
  stats: TravelStats
  loading: boolean
}) {
  const t = useTranslations("taxi.passportPanel")
  if (loading) {
    return (
      <div className="tx-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-3.5">
        <div className="grid shrink-0 grid-cols-2 gap-[9px]">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[104px] rounded-tx-md" />
          ))}
        </div>
        <Skeleton className="h-[180px] rounded-tx-md" />
      </div>
    )
  }

  return (
    <div className="tx-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-3.5">
      <div className="grid shrink-0 grid-cols-2 gap-[9px]">
        <StatBox icon="map" value={stats.visited.length} suffix={` / ${stops.length}`} label={t("visitedDestinations")} />
        <StatBox icon="route" value={stats.trips} label={t("totalTrips")} />
        <StatBox {...blocksTravelled(stats.blocks)} icon="walking" label={t("blocksTravelled")} />
        <StatBox icon="coins" value={formatNum(stats.spent)} label={t("taxiSpent")} money />
      </div>

      <Eyebrow icon="map" count={`${stats.visited.length}/${stops.length}`}>
        {t("passportStamps")}
      </Eyebrow>
      <div className="grid shrink-0 grid-cols-3 gap-[9px]">
        {stops.map((stop) => {
          const stamped = stats.visited.includes(stop.id)
          return (
            <div
              key={stop.id}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center gap-[5px] rounded-tx-md px-1.5 py-2 text-center",
                "border-[1.5px]",
                stamped
                  ? "border-solid border-tx-accent-soft bg-tx-accent-soft"
                  : "border-dashed border-tx-line-2 opacity-50",
              )}
            >
              {stamped && (
                <span className="absolute right-[5px] top-[5px] text-tx-accent">
                  <Icon name="check" size={13} stroke={3} />
                </span>
              )}
              <span
                className={cn(
                  "grid h-[30px] w-[30px] place-items-center rounded-full",
                  stamped ? "bg-tx-accent text-tx-on-accent" : "bg-tx-surface-2 text-tx-txt-3",
                )}
              >
                <Icon name={stamped ? "pin" : "lock"} size={15} stroke={2.2} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold leading-[1.15]",
                  stamped ? "text-tx-txt" : "text-tx-txt-2",
                )}
              >
                {stop.id}
              </span>
            </div>
          )
        })}
      </div>

      <Eyebrow icon="clock" count={trips.length}>
        {t("travelHistory")}
      </Eyebrow>
      <div className="flex flex-col gap-[9px]">
        {trips.length === 0 ? (
          <Empty icon="clock" message={t("emptyHistory")} />
        ) : (
          trips.map((trip) => (
            <div
              key={trip.id}
              className="flex gap-3 rounded-tx-md border border-solid border-tx-line bg-tx-surface p-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-tx-blue-500/[0.16] text-tx-blue-400">
                <Icon name="route" size={15} stroke={2} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex justify-between gap-2">
                  <span className="truncate text-sm font-bold text-tx-txt">{trip.stopId}</span>
                  <span className="shrink-0 font-tx-mono text-sm font-extrabold text-tx-money">
                    −{formatMoney(trip.price)}
                  </span>
                </span>
                <span className="flex justify-between gap-2 text-[11.5px] text-tx-txt-3">
                  <span>{relativeTime(trip.ts)}</span>
                  <span className="font-tx-mono">{formatNum(trip.blocks)} b</span>
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
