"use client"

import { useState } from "react"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { getSpriteUrl } from "@/utils/spriteUtils"
import { cn } from "@/lib/utils"
import { PokeBall } from "./PokeBall"

/**
 * A Pokémon sprite, resolved through the shared sprite manifest — the same
 * `id:form:palette` lookup the Pokédex and the PC use. §10 says sprites keep that
 * resolution and are not routed through a generic image component, so this
 * deliberately avoids `next/image` (which would resample pixel art).
 *
 * It subscribes to the manifest rather than calling `getSpriteUrl` blind: that helper
 * reads a `getState()` snapshot, so a sprite that first rendered before the manifest
 * landed would stay blank forever.
 */
export interface SpriteProps {
  dex: number
  form?: string
  palette?: string
  size?: number
  /** Pixelmon sprites are pixel art; smoothing them is a visible regression. */
  pixelated?: boolean
  className?: string
  alt?: string
}

export function Sprite({
  dex,
  form = "base",
  palette = "none",
  size = 64,
  pixelated = true,
  className,
  alt = "",
}: SpriteProps) {
  const [failed, setFailed] = useState(false)
  const manifest = useSpriteManifestStore((s) => s.manifest)

  const src = manifest ? getSpriteUrl({ id: dex, form, palette }) : null

  if (!src || failed) {
    // A Poké Ball, not a broken-image glyph: an unresolvable sprite is still a
    // Pokémon, and the card around it is already shaped like one.
    return (
      <span className={cn("grid place-items-center", className)} style={{ width: size, height: size }}>
        <PokeBall size={Math.round(size * 0.42)} />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("pointer-events-none object-contain", className)}
      style={{ width: size, height: size, imageRendering: pixelated ? "pixelated" : "auto" }}
    />
  )
}
