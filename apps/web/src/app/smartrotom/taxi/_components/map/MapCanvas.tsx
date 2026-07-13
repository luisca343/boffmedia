"use client"

import { useEffect, useMemo, type ReactNode } from "react"
import type { Region } from "@boffmedia/shared"
import type { EnrichedStop, Position } from "../../_types"
import { GRID_CELL_BLOCKS } from "../../_utils/constants"
import { useMapView } from "../../_hooks/useMapView"
import { RegionLayer } from "./RegionLayer"
import { OffscreenPin, PlayerMarker, StopPin } from "./StopPin"
import { Compass, RecenterButton, ScaleChip, ZoomControls } from "./MapControls"

/** How far inside the edge an off-screen indicator sits. */
const EDGE_MARGIN = 34

export function MapCanvas({
  stops,
  regions,
  player,
  selected,
  onSelect,
  reduceMotion,
  bottomInset = 0,
  recenterSignal,
  children,
}: {
  stops: EnrichedStop[]
  regions: Region[]
  player: Position
  selected: EnrichedStop | null
  onSelect: (stop: EnrichedStop) => void
  reduceMotion: boolean
  /** Pixels of map hidden behind the mobile sheet. */
  bottomInset?: number
  /** Increment to fly the camera back to the player. */
  recenterSignal: number
  /** The floating selected-stop card, on desktop. */
  children?: ReactNode
}) {
  const { ref, vp, view, anchorY, project, zoomBy, recenter, frame, handlers, dragging } = useMapView({
    player,
    bottomInset,
    reduceMotion,
  })

  // Selecting a stop frames the whole journey — both ends visible at once, which is the
  // question the player is actually asking ("how far is that?").
  useEffect(() => {
    if (selected) frame(selected)
    // `frame` changes identity with the player's position; re-framing on every step
    // would fight the player's own panning.
  }, [selected?.id])

  useEffect(() => {
    if (recenterSignal > 0) recenter()
  }, [recenterSignal])

  const playerPt = project(player.x, player.z)
  const selectedPt = selected ? project(selected.x, selected.z) : null

  const projected = useMemo(
    () =>
      stops.map((stop) => {
        const pt = project(stop.x, stop.z)
        const onScreen = pt.x > -20 && pt.x < vp.w + 20 && pt.y > -20 && pt.y < vp.h + 20
        return { stop, pt, onScreen }
      }),
    // The projection depends on the live view, which is a ref — these deps are what
    // actually change it.
    [stops, vp, view.cx, view.cz, view.s, project],
  )

  // The graticule pans with the map: one major cell is GRID_CELL_BLOCKS blocks, so its
  // pixel size is the zoom, and its offset is the camera modulo one cell.
  const cell = GRID_CELL_BLOCKS * view.s
  const gridOffsetX = (vp.w / 2 - view.cx * view.s) % cell
  const gridOffsetY = (anchorY - view.cz * view.s) % cell
  const grid = {
    backgroundImage:
      "linear-gradient(rgb(var(--tx-grid) / .10) 1px, transparent 1px)," +
      "linear-gradient(90deg, rgb(var(--tx-grid) / .10) 1px, transparent 1px)," +
      "linear-gradient(rgb(var(--tx-grid) / .05) 1px, transparent 1px)," +
      "linear-gradient(90deg, rgb(var(--tx-grid) / .05) 1px, transparent 1px)",
    backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px, ${cell / 5}px ${cell / 5}px, ${cell / 5}px ${cell / 5}px`,
    backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
  }

  const visibleBottom = vp.h - bottomInset

  return (
    <div
      ref={ref}
      className="absolute inset-0 select-none overflow-hidden touch-none"
      style={{ cursor: dragging ? "grabbing" : "grab" }}
      {...handlers}
    >
      <div className="absolute inset-0 bg-tx-field bg-[radial-gradient(130%_100%_at_50%_38%,rgb(var(--tx-blue-700)/0.22),transparent_70%)]" />

      <RegionLayer
        regions={regions}
        tx={vp.w / 2 - view.cx * view.s}
        ty={anchorY - view.cz * view.s}
        scale={view.s}
      />

      <div className="pointer-events-none absolute -inset-0.5" style={grid} />

      {/* The route: a dashed beam crawling from the player to the destination. */}
      {selectedPt && (
        <svg className="pointer-events-none absolute inset-0" width={vp.w} height={vp.h} aria-hidden="true">
          <defs>
            <linearGradient id="tx-beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--tx-blue-400))" />
              <stop offset="100%" stopColor="rgb(var(--tx-accent))" />
            </linearGradient>
          </defs>
          <line
            x1={playerPt.x}
            y1={playerPt.y}
            x2={selectedPt.x}
            y2={selectedPt.y}
            stroke="rgb(10 20 50 / 0.55)"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <line
            x1={playerPt.x}
            y1={playerPt.y}
            x2={selectedPt.x}
            y2={selectedPt.y}
            stroke="url(#tx-beam)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray="2 11"
            className={reduceMotion ? undefined : "animate-tx-beam motion-reduce:animate-none"}
          />
        </svg>
      )}

      {projected
        .filter((p) => p.onScreen)
        .map(({ stop, pt }) => (
          <StopPin
            key={stop.id}
            stop={stop}
            x={pt.x}
            y={pt.y}
            selected={selected?.id === stop.id}
            onSelect={onSelect}
          />
        ))}

      {projected
        .filter((p) => !p.onScreen)
        .map(({ stop, pt }) => {
          const angle = Math.atan2(pt.y - anchorY, pt.x - vp.w / 2)
          const radius = vp.w / 2 - EDGE_MARGIN
          const x = Math.max(EDGE_MARGIN, Math.min(vp.w - EDGE_MARGIN, vp.w / 2 + Math.cos(angle) * radius))
          const y = Math.max(EDGE_MARGIN, Math.min(visibleBottom - EDGE_MARGIN, anchorY + Math.sin(angle) * radius))
          return (
            <OffscreenPin
              key={`off-${stop.id}`}
              stop={stop}
              x={x}
              y={y}
              angle={angle}
              selected={selected?.id === stop.id}
              onSelect={onSelect}
            />
          )
        })}

      <PlayerMarker x={playerPt.x} y={playerPt.y} reduceMotion={reduceMotion} />

      <Compass />
      <ZoomControls onZoom={zoomBy} />
      <ScaleChip scale={view.s} bottom={bottomInset + 16} />
      <RecenterButton onClick={recenter} bottom={bottomInset + 18} />

      {children}
    </div>
  )
}
