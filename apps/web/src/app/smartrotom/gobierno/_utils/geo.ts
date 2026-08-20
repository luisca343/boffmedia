// World-coordinate geometry for the cadastral map. Ported from the Taxi app's approach
// (taxi/_utils/geo.ts, taxi/_components/map/RegionLayer.tsx): real WorldGuard region
// polygons ARE the map, not an invented backdrop. Adapted from a live pannable camera to
// a static "fit everything into one viewBox" projection — the Mapa is a plan of the
// region, not a first-person minimap that follows the player.

import type { Region } from "@boffmedia/shared"

export type Pt = { x: number; z: number }

/** Regions keyed by their own name — WorldGuard's identifier, which is also what
 * `Parcela.regionId` and `Parcela.town` reference (see `_utils/format.ts`). */
export function indexRegions(regions: Region[] | undefined): Map<string, Region> {
  const map = new Map<string, Region>()
  for (const r of regions ?? []) {
    if (r.points && r.points.length >= 3) map.set(r.name, r)
  }
  return map
}

/** Vertex average of a polygon — good enough to place a label or a pin; not the
 * area-weighted centroid, which nobody would notice the difference of on a plot. */
export function centroid(points: Pt[]): Pt {
  const n = points.length || 1
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, z: a.z + p.z }), { x: 0, z: 0 })
  return { x: sum.x / n, z: sum.z / n }
}

export function bounds(points: Pt[]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const xs = points.map((p) => p.x)
  const zs = points.map((p) => p.z)
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) }
}

export type Projection = {
  width: number
  height: number
  scale: number
  x: (worldX: number) => number
  y: (worldZ: number) => number
  r: (worldR: number) => number
}

/** Fits a cloud of world points into a fixed-width viewBox, preserving aspect ratio. */
export function fitProjection(points: Pt[], opts: { width?: number; pad?: number } = {}): Projection {
  const width = opts.width ?? 1000
  const pad = opts.pad ?? 120
  if (points.length === 0) {
    return { width, height: width, scale: 1, x: () => width / 2, y: () => width / 2, r: (n) => n }
  }
  const b = bounds(points)
  const minX = b.minX - pad
  const maxX = b.maxX + pad
  const minZ = b.minZ - pad
  const maxZ = b.maxZ + pad
  const scale = width / Math.max(1, maxX - minX)
  const height = Math.max(1, maxZ - minZ) * scale
  return {
    width,
    height,
    scale,
    x: (worldX: number) => (worldX - minX) * scale,
    y: (worldZ: number) => (worldZ - minZ) * scale,
    r: (worldR: number) => worldR * scale,
  }
}

/** SVG path `d` for a closed polygon in world space, run through a projection. */
export function polygonPath(points: Pt[], proj: Projection): string {
  if (points.length < 3) return ""
  return `M${points.map((p) => `${proj.x(p.x)},${proj.y(p.z)}`).join("L")}Z`
}

/** A deterministic hue from a town's own (real) name — there is no admin-assigned town
 * colour anywhere in the data, so this is the honest way to give each town a stable,
 * distinct fill without inventing a palette. Used only as inline SVG/style values, which
 * is the documented exception for data-driven colour. */
export function townHue(town: string): number {
  let h = 0
  for (let i = 0; i < town.length; i++) h = (h * 31 + town.charCodeAt(i)) >>> 0
  return h % 360
}

export function townColor(town: string): string {
  return `hsl(${townHue(town)} 38% 34%)`
}
