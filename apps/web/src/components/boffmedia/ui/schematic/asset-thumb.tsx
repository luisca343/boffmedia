"use client"

import { type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { placeholderColor, placeholderGlyph, type SchRing } from "./lib"

export interface AssetThumbProps {
  id: string
  size?: number
  ring?: SchRing
}

const RING_SHADOW: Record<Exclude<SchRing, null>, string> = {
  safe: "0 0 0 1.5px color-mix(in srgb, var(--emerald-400) 60%, transparent)",
  warn: "0 0 0 1.5px color-mix(in srgb, var(--amber-400) 60%, transparent)",
  bad: "0 0 0 1.5px color-mix(in srgb, var(--rose-400) 60%, transparent)",
}

// Square tile for a block asset. With no texture available it renders a
// deterministic fallback: an oklch colour from the id hash + the name initial.
export function AssetThumb({ id, size = 28, ring }: AssetThumbProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    background: placeholderColor(id),
    fontSize: Math.round(size * 0.42),
    boxShadow: ring ? RING_SHADOW[ring] : undefined,
  }
  return (
    <div
      title={id}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[4px] border border-edge",
        "grid place-items-center font-extrabold text-[rgba(255,255,255,0.92)]",
        "[image-rendering:pixelated]",
      )}
      style={style}
    >
      {placeholderGlyph(id)}
    </div>
  )
}
