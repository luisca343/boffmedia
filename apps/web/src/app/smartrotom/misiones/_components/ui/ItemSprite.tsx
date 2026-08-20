"use client"

import { useEffect, useState } from "react"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { cn } from "@/lib/utils"

const cache = new Map<string, string | null>()

/**
 * The real Minecraft/Pixelmon item sprite for a reward or an objective.
 * Misiones-local by design: the Pokédex has its own copy, but that one is a
 * `pk-*` component, and a `ms-*` screen must not reach across into another
 * app's library. When the id resolves to nothing — the
 * common case for a free-text objective — it falls back to a wax glyph rather
 * than a broken image.
 */
export function ItemSprite({
  name,
  size = 40,
  glyph = "◆",
  className,
}: {
  name: string
  size?: number
  glyph?: string
  className?: string
}) {
  const [url, setUrl] = useState<string | null | undefined>(() => cache.get(name))

  useEffect(() => {
    let cancelled = false
    if (cache.has(name)) {
      setUrl(cache.get(name))
      return
    }
    PokemonService.getItemSprite(name)
      .then((response) => {
        const resolved = (response.success && response.data?.url) || null
        cache.set(name, resolved)
        if (!cancelled) setUrl(resolved)
      })
      .catch(() => {
        cache.set(name, null)
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [name])

  if (!url) {
    return (
      <span
        aria-hidden
        className={cn("grid place-items-center font-ms-display text-ms-ink-2", className)}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {url === undefined ? "" : glyph}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={cn("[image-rendering:pixelated]", className)}
      style={{ width: size, height: size }}
    />
  )
}
