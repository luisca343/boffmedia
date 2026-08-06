import { useEffect, useState } from "react"

import { Icon } from "@boffmedia/ui"

import { iconSrc } from "../runtime"

// A player's face, cropped out of their Minecraft skin.
//
// Deliberately NOT a third-party avatar service (mc-heads, crafatar and the
// like). Those mean shipping every player's UUID to a host that has nothing to
// do with this launcher, they widen the CSP to a domain we do not control, and
// they render nothing when the player is offline.
//
// Instead the skin sheet comes from the profile call we already make during
// sign-in, goes through `icon_cache` — the same on-disk cache the mod icons
// use, arriving as a `data:` URL the CSP already allows — and is
// cropped here in pure CSS. No image library, no extra request, and a cached
// face survives having no connection at all.
//
// The geometry: a skin sheet is 64×64 and the head's front face is the 8×8
// square at (8,8). The "hat" layer — the second skin layer players use for
// hair and glasses — is the 8×8 at (40,8) and is drawn on top. Scaling by
// size/8 makes the 8px face fill the box, and `pixelated` keeps it looking
// like Minecraft instead of a smudge.

const SHEET = 64
const FACE = 8

export function PlayerHead({
  skinUrl,
  size = 32,
  className,
}: {
  skinUrl: string
  size?: number
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!skinUrl) {
      setSrc(null)
      return
    }
    let alive = true
    // `iconSrc` never throws — a face that will not load is cosmetic, and the
    // fallback below is a perfectly good answer.
    void iconSrc(skinUrl).then((url) => {
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [skinUrl])

  // No skin, or the cache could not produce one: the generic silhouette, which
  // is what this component replaced everywhere and is still the right answer
  // for an account whose skin we have never seen.
  if (!src) {
    return (
      <span
        className={`cut-seal grid shrink-0 place-items-center bg-panel text-txt-dim ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <Icon name="user" size={Math.round(size * 0.5)} />
      </span>
    )
  }

  const scale = size / FACE
  const layer = {
    backgroundImage: `url("${src}")`,
    backgroundSize: `${SHEET * scale}px ${SHEET * scale}px`,
    imageRendering: "pixelated" as const,
  }

  return (
    <span
      className={`cut-seal relative block shrink-0 bg-panel ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ ...layer, backgroundPosition: `-${FACE * scale}px -${FACE * scale}px` }}
      />
      {/* Second layer. Transparent for most skins, which is why it can simply
          be stacked rather than detected. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ ...layer, backgroundPosition: `-${40 * scale}px -${FACE * scale}px` }}
      />
    </span>
  )
}
