"use client"

import React, { useMemo, useRef, useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { loadCatPartsFrames, mewCatSvgUrl } from "./data-loader"
import type { CatParts } from "./types"

interface PartThumbnailGridProps {
  partKey: keyof CatParts
  value: number | { left?: number; right?: number; leg1?: number; leg2?: number; arm1?: number; arm2?: number }
  onChange: (frame: number) => void
  clipName: string // lowercase — the asset directory and frame-index key
  clipNamePascal?: string // PascalCase; only compositing (part_bounds) needs it
  /** Tile edge in px. The rail wants 80; the drawer wants room to actually see the art. */
  tileSize?: number
  /** Never drop below this many columns, however narrow the container gets. */
  minCols?: number
  /** Sizing for the scroller. Pass `flex-1 min-h-0` to fill a flex parent. */
  scrollClassName?: string
  /** The drawer prints the slot name in its own header, so the grid can drop it. */
  showTitle?: boolean
  className?: string
}

const GRID_GAP = 8
const BUFFER_SIZE = 3 // extra rows rendered above and below the viewport

export function PartThumbnailGrid({
  partKey,
  value,
  onChange,
  clipName,
  tileSize = 80,
  minCols = 3,
  scrollClassName = "h-[320px]",
  showTitle = true,
  className = "flex flex-col gap-2",
}: Omit<PartThumbnailGridProps, "clipNamePascal">) {
  const t = useTranslations("mewgenics")
  const [frames, setFrames] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 60 })
  // Columns come from the measured scroller, not a constant: the same grid now
  // renders in a 260px rail and in a full-width drawer, and a hardcoded 3 wasted
  // most of the drawer while overflowing the rail.
  const [cols, setCols] = useState(minCols)
  const rowHeight = tileSize + GRID_GAP

  // Get current value as number
  const currentFrame = useMemo(() => {
    if (typeof value === "number") return value
    if (value && typeof value === "object") {
      if ("left" in value) return (value as { left?: number }).left || 1
      if ("leg1" in value) return (value as { leg1?: number }).leg1 || 1
      if ("arm1" in value) return (value as { arm1?: number }).arm1 || 1
    }
    return 1
  }, [value])

  // Load the pickable frames. This MUST come from catparts_frames.json (what
  // the exporter actually shipped) and not from part_bounds, which covers a
  // clip's whole timeline — CatBody has 1200 frames there but only 299 SVGs
  // exist, so offering part_bounds keys 404s on every gap.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const index = await loadCatPartsFrames()
        const frameList = index.clips[clipName] || []
        if (!alive) return
        setFrames(frameList)
        const idx = frameList.indexOf(currentFrame)
        setSelectedIndex(Math.max(0, idx))
      } catch (err) {
        console.error("Failed to load part frames:", err)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [clipName, currentFrame])

  // Row-based windowing. Everything below counts in ROWS, never in items —
  // mixing the two is what left tiles floating in blank space before.
  const totalRows = Math.ceil(frames.length / cols)
  const recomputeWindow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const first = Math.max(0, Math.floor(el.scrollTop / rowHeight) - BUFFER_SIZE)
    const last = Math.min(
      totalRows,
      Math.ceil((el.scrollTop + el.clientHeight) / rowHeight) + BUFFER_SIZE,
    )
    setVisibleRange({ start: first * cols, end: last * cols })
  }, [totalRows, cols, rowHeight])

  // Measure the scroller and derive the column count from it.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      const inner = el.clientWidth - 16 /* p-2 */
      const next = Math.max(minCols, Math.floor((inner + GRID_GAP) / (tileSize + GRID_GAP)))
      setCols((prev) => (prev === next ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [tileSize, minCols, loading])

  // Recompute once the frame list (and therefore the scroller) exists.
  useEffect(() => {
    recomputeWindow()
  }, [recomputeWindow, frames.length])

  // Bring the selected part into view when the list first loads.
  const didScrollToSelection = useRef(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || didScrollToSelection.current || selectedIndex < 0 || !frames.length) return
    didScrollToSelection.current = true
    const row = Math.floor(selectedIndex / cols)
    el.scrollTop = Math.max(0, row * rowHeight - el.clientHeight / 2 + rowHeight / 2)
    recomputeWindow()
  }, [selectedIndex, frames.length, cols, rowHeight, recomputeWindow])

  // Handle search/jump to frame
  const handleSearch = (input: string) => {
    setSearchInput(input)
    if (!input) return
    const frameNum = parseInt(input, 10)
    if (!isNaN(frameNum)) {
      const idx = frames.indexOf(frameNum)
      if (idx >= 0) {
        setSelectedIndex(idx)
        onChange(frameNum)
      }
    }
  }

  // Handle frame selection
  const handleFrameClick = (frame: number) => {
    const idx = frames.indexOf(frame)
    setSelectedIndex(idx)
    onChange(frame)
  }

  const visibleFrames = frames.slice(visibleRange.start, visibleRange.end)
  const offsetTop = Math.floor(visibleRange.start / cols) * rowHeight
  const totalHeight = totalRows * rowHeight

  return (
    <div className={className}>
      {showTitle && (
        <div className="text-[11px] font-bold text-[color:var(--mwp-cream-dim)] uppercase">
          {t(`builder.parts.${partKey}`)}
        </div>
      )}

      {/* Search and count */}
      <div className="flex flex-none gap-2 items-center">
        <input
          type="text"
          inputMode="numeric"
          placeholder={t("builder.search")}
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-2 py-1.5 text-[11px] bg-[color:var(--mwp-night-3)] text-[color:var(--mwp-cream)] border-2 border-[color:var(--mwp-nline)] [border-radius:var(--wob-sm)] focus:outline-none focus:border-[color:var(--mwp-ink)]"
        />
        {frames.length > 0 && (
          <span className="text-[10px] text-[color:var(--mwp-cream-dim)] whitespace-nowrap">
            {t("builder.partOf", { n: selectedIndex + 1, total: frames.length })}
          </span>
        )}
      </div>

      {/* Virtualized grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[11px] text-[color:var(--mwp-cream-dim)]">
          {t("builder.loadingParts")}
        </div>
      ) : frames.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[11px] text-[color:var(--mwp-cream-dim)]">
          {t("builder.noResults")}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={`${scrollClassName} overflow-y-auto overflow-x-hidden bg-[color:var(--mwp-night-3)] [border-radius:var(--wob-sm)] border-2 border-[color:var(--mwp-nline)] p-2`}
          onScroll={recomputeWindow}
        >
          {/* Full-height spacer keeps the scrollbar honest; the window of live
              tiles is pushed down to its true row offset. */}
          <div style={{ height: totalHeight, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: offsetTop,
                left: 0,
                right: 0,
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(0, ${tileSize}px))`,
                justifyContent: "space-between",
                gap: `${GRID_GAP}px`,
              }}
            >
              {visibleFrames.map((frame) => (
                <PartTile
                  key={frame}
                  frame={frame}
                  clipName={clipName}
                  size={tileSize}
                  isSelected={frame === currentFrame}
                  onClick={() => handleFrameClick(frame)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PartTile({
  frame,
  clipName,
  size,
  isSelected,
  onClick,
}: {
  frame: number
  clipName: string
  size: number
  isSelected: boolean
  onClick: () => void
}) {
  const svgUrl = mewCatSvgUrl(clipName.toLowerCase(), frame)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`relative flex items-center justify-center [border-radius:var(--wob-sm)] border-2 transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] ${
        isSelected
          ? "border-[color:var(--mwp-red)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
          : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-night-2)]"
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--mwp-night-2)",
        backgroundImage: `url("${svgUrl}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      title={`#${frame}`}
    >
      {/* Frame number label */}
      <div className="absolute bottom-1 right-1 bg-[color:var(--mwp-night)]/80 px-1 py-0.5 [border-radius:2px] text-[8px] font-mono text-[color:var(--mwp-cream-dim)]">
        {frame}
      </div>
    </button>
  )
}
