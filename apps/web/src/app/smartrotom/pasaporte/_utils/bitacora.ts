import type { useTranslations } from "next-intl"
import type { StarBankTransaction, UserAchievement } from "@boffmedia/shared"
import { tripsFromTransactions } from "@/app/smartrotom/taxi/_utils/trips"
import type { TravelStamp } from "../_types"

export type { TravelStamp } from "../_types"

/**
 * A stamp's shape and tilt are hashed from its id, never randomised.
 *
 * A random tilt would be re-rolled on every render, and a stamp that moves when the page
 * re-paints is not ink on paper — it is an animation. Hashing the id means the same stamp
 * sits at the same angle forever, on every device, without storing anything.
 */
function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const SHAPES: TravelStamp["shape"][] = ["circle", "oval", "rect"]

function shapeOf(id: string): TravelStamp["shape"] {
  return SHAPES[hash(id) % SHAPES.length]
}

/** −10°…+10°, the range a hand-pressed stamp actually lands in. */
function rotOf(id: string): number {
  return ((hash(id) >>> 8) % 21) - 10
}

/** Categories arrive with accents and mixed case; compare on a folded form, not on the raw string. */
function fold(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function kindOf(achievement: UserAchievement): TravelStamp["kind"] {
  const category = fold(achievement.category)
  if (category === "gimnasios") return "gimnasio"
  if (category === "ligas" || category === "frente batalla") return "liga"
  return "evento"
}

function subOf(
  achievement: UserAchievement,
  kind: TravelStamp["kind"],
  t: ReturnType<typeof useTranslations>,
): string {
  const sub = (achievement.subcategory ?? "").trim().toUpperCase()
  if (kind === "gimnasio") return sub ? t("bitacora.stamp.gymWithSub", { sub }) : t("bitacora.stamp.gymBare")
  if (kind === "liga") return sub ? t("bitacora.stamp.leagueWithSub", { sub }) : t("bitacora.stamp.leagueChampion")
  const category = (achievement.category ?? "").trim().toUpperCase()
  return sub ? `${category} · ${sub}` : category
}

function iso(value: string | null | undefined): string | null {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null
}

/**
 * The Bitácora, recovered from what the trainer actually did.
 *
 * Two real sources, and nothing else: a completed achievement (they stood in that gym) and
 * a paid taxi fare (they travelled to that stop). The trips come from
 * `tripsFromTransactions` in the Taxi's own utils rather than a copy — it is the same
 * StarBank ledger and the same truth, and it already knows that direction must be read off
 * `to`, never off `isPayer` (which the API declares but never populates).
 */
export function stampsFromHistory(
  achievements: UserAchievement[] = [],
  transactions: StarBankTransaction[] = [],
  t: ReturnType<typeof useTranslations>,
): TravelStamp[] {
  const stamps: TravelStamp[] = []

  for (const achievement of achievements) {
    // `completed` is 0/1 from the API, not a boolean.
    if (!achievement.completed) continue
    // A stamp is a dated entry. Without a date there is nothing to ink, so it is not a stamp.
    const date = iso(achievement.completedAt)
    if (!date) continue

    const kind = kindOf(achievement)
    const id = `logro:${achievement.id}`
    stamps.push({
      id,
      place: (achievement.name ?? "").trim().toUpperCase(),
      sub: subOf(achievement, kind, t),
      date,
      kind,
      shape: shapeOf(id),
      rot: rotOf(id),
      ...(kind === "liga" ? { gold: true } : {}),
    })
  }

  // A passport stamps an ENTRY, not every commute: the same stop reached fifty times is
  // one stamp, dated the first time the trainer arrived.
  const arrivals = new Map<string, number>()
  for (const trip of tripsFromTransactions(transactions)) {
    const first = arrivals.get(trip.stopId)
    if (first === undefined || trip.ts < first) arrivals.set(trip.stopId, trip.ts)
  }

  for (const [stopId, ts] of arrivals) {
    // `tripsFromTransactions` falls back to ts 0 for a row it cannot date; stamping that
    // would ink a 1970 entry onto the page.
    if (ts <= 0) continue
    const date = new Date(ts).toISOString()
    const id = `viaje:${stopId}`
    stamps.push({
      id,
      place: stopId.trim().toUpperCase(),
      sub: t("bitacora.stamp.visado"),
      date,
      kind: "viaje",
      shape: shapeOf(id),
      rot: rotOf(id),
    })
  }

  return stamps.sort((a, b) => a.date.localeCompare(b.date))
}
