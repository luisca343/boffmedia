import { intlLocale } from "@/lib/locale"
import type { MinecraftStats } from "@/services/api/smartrotom/playerService"
import type { MovementRow } from "../_types"

/**
 * The blob's declared type lists every key as required, but the server only sends the
 * counters a player has actually moved: a trainer who never boarded a boat has no
 * `minecraft:boat_one_cm` at all. So every read goes through here and a missing counter
 * is 0 — never `undefined`, which would poison the arithmetic into NaN and print "NaN km".
 */
type Blob = MinecraftStats | null | undefined

function custom(stats: Blob): Record<string, number> {
  return (stats?.stats?.["minecraft:custom"] ?? {}) as Record<string, number>
}

function read(stats: Blob, key: string): number {
  const value = custom(stats)[key]
  return Number.isFinite(value) ? value : 0
}

/** Playtime is stored in TICKS. 20 ticks = 1 second, so 20 * 60 ticks = 1 minute. */
export function playtime(stats: Blob): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(read(stats, "minecraft:play_one_minute") / (20 * 60))
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

/** Distances are stored in CENTIMETRES. 100 cm = 1 m, 1000 m = 1 km → 100 000 cm = 1 km. */
export function km(cm: number): number {
  return Number.isFinite(cm) ? cm / 100_000 : 0
}

const DISTANCE_KEYS = [
  "minecraft:walk_one_cm",
  "minecraft:sprint_one_cm",
  "minecraft:horse_one_cm",
  "minecraft:boat_one_cm",
  "minecraft:swim_one_cm",
] as const

/** Ground covered on foot, on horseback, by boat and swimming. Flying is not travel here. */
export function distanceKm(stats: Blob): number {
  return km(DISTANCE_KEYS.reduce((total, key) => total + read(stats, key), 0))
}

/**
 * The six-row breakdown. Five are distances; `saltos` is a plain count, which is why the
 * rows carry their own unit instead of the table assuming one.
 */
export function perMovement(stats: Blob): MovementRow[] {
  return [
    { key: "walk", value: km(read(stats, "minecraft:walk_one_cm")), unit: "km" },
    { key: "sprint", value: km(read(stats, "minecraft:sprint_one_cm")), unit: "km" },
    { key: "horse", value: km(read(stats, "minecraft:horse_one_cm")), unit: "km" },
    { key: "boat", value: km(read(stats, "minecraft:boat_one_cm")), unit: "km" },
    { key: "swim", value: km(read(stats, "minecraft:swim_one_cm")), unit: "km" },
    { key: "jump", value: read(stats, "minecraft:jump"), unit: "n" },
  ]
}

/** Every entity the trainer has ever felled, summed across species. */
export function totalKills(stats: Blob): number {
  const killed = (stats?.stats?.["minecraft:killed"] ?? {}) as Record<string, number>
  return Object.values(killed).reduce<number>((total, n) => total + (Number.isFinite(n) ? n : 0), 0)
}

export function deaths(stats: Blob): number {
  return read(stats, "minecraft:deaths")
}

/** Compact figures for the stat plates: 1,2K · 3,4M (es) / 1.2K · 3.4M (en) · 12.480. */
export function fmt(n: number, locale?: string | null): string {
  if (!Number.isFinite(n)) return "0"
  const tag = intlLocale(locale)
  const abs = Math.abs(n)
  const decimal = (v: number, suffix: string) =>
    `${v.toLocaleString(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}${suffix}`
  if (abs >= 1_000_000) return decimal(n / 1_000_000, "M")
  if (abs >= 1_000) return decimal(n / 1_000, "K")
  return new Intl.NumberFormat(tag).format(Math.round(n))
}
