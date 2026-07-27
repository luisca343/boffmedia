import type { Region } from "@boffmedia/shared"

/** Euclidean distance in blocks. Y is ignored — the fare only pays for ground travel. */
export function distance(x1: number, z1: number, x2: number, z2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
}

/**
 * Compass bearing from one point to another, in degrees clockwise from North.
 * Minecraft's North is −Z, which is why the arguments to `atan2` look transposed.
 */
export function bearing(fromX: number, fromZ: number, toX: number, toZ: number): number {
  const deg = (Math.atan2(toX - fromX, -(toZ - fromZ)) * 180) / Math.PI
  return deg < 0 ? deg + 360 : deg
}

/** Key ids under `taxi.compass` — the component resolves them with `t(...)`. */
const COMPASS = ["n", "ne", "e", "se", "s", "so", "o", "no"] as const

export type CompassKey = (typeof COMPASS)[number]

/** Returns a `taxi.compass.*` key id, never copy. */
export function compassKey(deg: number): CompassKey {
  return COMPASS[Math.round(deg / 45) % 8]
}

/** Ray-casting point-in-polygon, on the X/Z plane. */
function pointInPolygon(x: number, z: number, points: { x: number; z: number }[]): boolean {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i]
    const b = points[j]
    const straddles = a.z > z !== b.z > z
    if (straddles && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside
  }
  return inside
}

/** WorldGuard region names are slugs (`pueblo_kinoko`) — the UI wants a label. */
function prettify(name: string): string {
  const words = name.replace(/[_-]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The region a stop stands in, from the world's real WorldGuard polygons. The handoff
 * gave every stop a hand-written zone ("Costa", "Montaña"); we have no such field, but
 * the world does define named regions, so we resolve one by geometry instead of
 * inventing a taxonomy. A stop outside every region simply has none, and the region
 * filters only ever offer regions that at least one stop actually falls in.
 *
 * Regions can nest (a plot inside a town), so the smallest match wins — that is the
 * most specific place name for the stop.
 */
export function regionForPoint(x: number, z: number, regions: Region[]): string | undefined {
  let best: { name: string; area: number } | undefined
  for (const region of regions) {
    const points = region.points
    if (!points || points.length < 3) continue
    if (!pointInPolygon(x, z, points)) continue
    const area = polygonArea(points)
    if (!best || area < best.area) best = { name: prettify(region.name), area }
  }
  return best?.name
}

/** Shoelace area — only used to rank nested matches, so the sign is irrelevant. */
function polygonArea(points: { x: number; z: number }[]): number {
  let sum = 0
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += (points[j].x + points[i].x) * (points[j].z - points[i].z)
  }
  return Math.abs(sum / 2)
}
