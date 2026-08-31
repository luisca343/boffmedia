"use client"

import React, { useMemo, useRef, useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { loadCatPartsFrames, mewCatSvgUrl } from "./data-loader"
import type { CatParts } from "./types"

interface PartPickerProps {
  partKey: keyof CatParts
  value: number | { left?: number; right?: number; leg1?: number; leg2?: number; arm1?: number; arm2?: number }
  onChange: (frame: number) => void
  clipName: string // lowercase — the asset directory and frame-index key
  clipNamePascal?: string // PascalCase; only compositing (part_bounds) needs it
  displayLabel: string
}

const TILE_SIZE = 80
const GRID_COLS = 3
const GRID_GAP = 8
const ROW_HEIGHT = TILE_SIZE + GRID_GAP
const BUFFER_SIZE = 3 // extra rows rendered above and below the viewport

export function PartThumbnailGrid({
  partKey,
  value,
  onChange,
  clipName,
}: Omit<PartPickerProps, "displayLabel">) {
  const t = useTranslations("mewgenics")
  const [frames, setFrames] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: GRID_COLS * BUFFER_SIZE })

  // Get current value as number
  const currentFrame = useMemo(() => {
    if (typeof value === "number") return value
    if (value && typeof value === "object") {
      if ("left" in value) return (value as any).left || 1
      if ("leg1" in value) return (value as any).leg1 || 1
      if ("arm1" in value) return (value as any).arm1 || 1
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
  const totalRows = Math.ceil(frames.length / GRID_COLS)
  const recomputeWindow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const first = Math.max(0, Math.floor(el.scrollTop / ROW_HEIGHT) - BUFFER_SIZE)
    const last = Math.min(
      totalRows,
      Math.ceil((el.scrollTop + el.clientHeight) / ROW_HEIGHT) + BUFFER_SIZE,
    )
    setVisibleRange({ start: first * GRID_COLS, end: last * GRID_COLS })
  }, [totalRows])

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
    const row = Math.floor(selectedIndex / GRID_COLS)
    el.scrollTop = Math.max(0, row * ROW_HEIGHT - el.clientHeight / 2 + ROW_HEIGHT / 2)
    recomputeWindow()
  }, [selectedIndex, frames.length, recomputeWindow])

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
  const offsetTop = Math.floor(visibleRange.start / GRID_COLS) * ROW_HEIGHT
  const totalHeight = totalRows * ROW_HEIGHT

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-bold text-[color:var(--mwp-cream-dim)] uppercase">
        {t(`builder.parts.${partKey}`)}
      </div>

      {/* Search and count */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder={t("builder.search")}
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-2 py-1 text-[11px] bg-[color:var(--mwp-night-3)] text-[color:var(--mwp-cream)] border-2 border-[color:var(--mwp-nline)] [border-radius:var(--wob-sm)] focus:outline-none focus:border-[color:var(--mwp-ink)]"
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
          className="h-[320px] overflow-y-auto overflow-x-hidden bg-[color:var(--mwp-night-3)] [border-radius:var(--wob-sm)] border-2 border-[color:var(--mwp-nline)] p-2"
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
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                gap: `${GRID_GAP}px`,
              }}
            >
              {visibleFrames.map((frame) => (
                <PartTile
                  key={frame}
                  frame={frame}
                  clipName={clipName}
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
  isSelected,
  onClick,
}: {
  frame: number
  clipName: string
  isSelected: boolean
  onClick: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const svgUrl = mewCatSvgUrl(clipName.toLowerCase(), frame)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center [border-radius:var(--wob-sm)] border-2 transition-all overflow-hidden ${
        isSelected
          ? "border-[color:var(--mwp-red)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
          : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)]"
      }`}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: "var(--mwp-night-2)",
        backgroundImage: imageFailed ? "none" : `url("${svgUrl}")`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      title={`Frame ${frame}`}
    >
      {/* Frame number label */}
      <div className="absolute bottom-1 right-1 bg-[color:var(--mwp-night)] bg-opacity-80 px-1 py-0.5 [border-radius:2px] text-[8px] font-mono text-[color:var(--mwp-cream-dim)]">
        {frame}
      </div>

      {/* Loading state - only show if the SVG hasn't loaded yet */}
      {!imageLoaded && !imageFailed && (
        <div className="text-[8px] text-[color:var(--mwp-cream-dim)]">...</div>
      )}

      {/* Failed state */}
      {imageFailed && (
        <div className="text-[8px] text-[color:var(--mwp-bad)]">!</div>
      )}
    </button>
  )
}
