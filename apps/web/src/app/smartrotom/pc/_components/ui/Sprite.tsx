"use client"

import { useState } from "react"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { getSpriteUrl } from "@/utils/spriteUtils"
import { Icon } from "./Icon"

export interface SpriteProps {
  dex: number
  form?: string
  palette?: string
  className?: string
  /** Pixelmon sprites are pixel art; smoothing them is a visible regression. */
  pixelated?: boolean
  alt?: string
}

/**
 * A Pokémon sprite, resolved through the shared sprite manifest — the same
 * `id:form:palette` lookup (with its form/palette fallbacks) the Pokédex uses.
 * SMARTROTOM_V3.md §10 says sprites keep that resolution and are not routed through
 * a generic image component, so this deliberately does not use `next/image`.
 *
 * It reads the manifest *reactively* rather than through `getSpriteUrl`'s
 * `getState()` snapshot, so ~900 slots all fill in when the manifest lands instead
 * of staying blank until something else forces a re-render. The manifest itself is
 * fetched once, by the layout.
 */
export function Sprite({ dex, form, palette, className = "", pixelated = true, alt = "" }: SpriteProps) {
  const [failed, setFailed] = useState(false)
  // Subscribing to the manifest is what makes this reactive: `getSpriteUrl` reads a
  // `getState()` snapshot, so on its own it would return null forever for every slot
  // that first rendered before the manifest landed.
  const manifest = useSpriteManifestStore((s) => s.manifest)

  const src = manifest
    ? getSpriteUrl({ id: dex, form: form || "base", palette: palette || "none" })
    : null

  if (!src || failed) {
    return (
      <span className={`flex items-center justify-center ${className}`}>
        <Icon name="package" size={22} className="text-pc-fg-subtle/60" />
      </span>
    )
  }

  return (
    // Not `next/image`: the manifest already resolves the URL, and the optimiser would
    // resample pixel art. See the doc comment above.
    <img
      src={src}
      alt={alt}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`pointer-events-none object-contain ${className}`}
      style={{
        imageRendering: pixelated ? "pixelated" : "auto",
        filter: "drop-shadow(0 4px 5px rgb(0 0 0 / .5))",
      }}
    />
  )
}
