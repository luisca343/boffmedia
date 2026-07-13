import { useMemo } from "react"
import type { Region } from "@boffmedia/shared"

/**
 * The world's real WorldGuard regions, drawn as the map's landmass.
 *
 * The handoff painted five invented "biome zones" at invented coordinates to give the
 * placeholder map a sense of place. We don't need the invention: the server already
 * knows the shape of every town, plot and protected area, so those polygons ARE the
 * sense of place — and a player recognises their own town on the map.
 *
 * Drawn in WORLD coordinates inside a single transformed `<g>`, so panning and zooming
 * is one matrix update rather than a reprojection of every vertex on every frame.
 */
export function RegionLayer({
  regions,
  tx,
  ty,
  scale,
}: {
  regions: Region[]
  tx: number
  ty: number
  scale: number
}) {
  const d = useMemo(
    () =>
      regions
        .filter((r) => r.points?.length >= 3)
        .map((r) => `M${r.points.map((p) => `${p.x},${p.z}`).join("L")}Z`)
        .join(""),
    [regions],
  )

  if (!d) return null

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        <path
          d={d}
          fill="rgb(var(--tx-blue-500) / 0.10)"
          stroke="rgb(var(--tx-blue-400) / 0.28)"
          strokeWidth={1.5}
          // Without this the hairline scales with the zoom and turns into a slab.
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
