"use client"

import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { placeholderColor, placeholderGlyph } from "@/lib/schematic/textures/blockTexture"

/** Status ring drawn around a tile. `null` draws no ring. */
export type SchRing = "safe" | "warn" | "bad" | null

/** Swaps in a real-texture tile; falls back to {@link AssetThumb} when absent. */
export type ThumbRenderer = (id: string, size: number, ring?: SchRing) => ReactNode

const RING_VAR: Record<Exclude<SchRing, null>, string> = {
  safe: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
}

export interface AssetThumbProps {
  id: string
  size?: number
  ring?: SchRing
  className?: string
}

/**
 * Deterministic tile for a block id — the same id always yields the same colour
 * and initial, so the eye can learn a block without a texture ever loading.
 */
export function AssetThumb({ id, size = 28, ring, className }: AssetThumbProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    background: placeholderColor(id),
    fontSize: Math.round(size * 0.42),
    boxShadow: ring ? `0 0 0 1.5px color-mix(in srgb, ${RING_VAR[ring]} 60%, transparent)` : undefined,
  }
  return (
    <div
      title={id}
      className={cn(
        "relative shrink-0 overflow-hidden border border-line grid place-items-center",
        "font-extrabold text-white/90 [image-rendering:pixelated]",
        className,
      )}
      style={style}
    >
      {placeholderGlyph(id)}
    </div>
  )
}
