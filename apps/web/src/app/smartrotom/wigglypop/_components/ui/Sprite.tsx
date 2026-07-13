"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { getSpriteUrl } from "@/utils/spriteUtils"
import type { WpMon } from "../../_types/market.types"
import { wallClassFor } from "../../_utils/spriteTheme"
import { Icon } from "./Icon"

/**
 * A Pokémon sprite, resolved through the shared sprite manifest — the same
 * `id:form:palette` lookup (with its form/palette fallbacks) the PC and Pokédex use.
 * Deliberately not `next/image`: the manifest already resolves the URL and the
 * optimiser would resample pixel art (§10).
 *
 * It subscribes to the manifest store rather than calling `getSpriteUrl`'s
 * `getState()` snapshot, so a whole grid fills in when the manifest lands instead of
 * staying blank until something else forces a re-render.
 */
export function Sprite({
  mon,
  className,
  hero = false,
  alt,
}: {
  mon: Pick<WpMon, "dex" | "form" | "palette" | "name">
  className?: string
  /** The detail page's big one: same pixels, deeper drop, floats. */
  hero?: boolean
  alt?: string
}) {
  const [failed, setFailed] = useState(false)
  const manifest = useSpriteManifestStore((s) => s.manifest)

  const src = manifest
    ? getSpriteUrl({ id: mon.dex, form: mon.form || "base", palette: mon.palette || "none" })
    : null

  if (!src || failed) {
    return (
      <span className={cn("flex items-center justify-center", className)}>
        <Icon name="package" size={hero ? 64 : 24} className="text-wp-fg-subtle/60" />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt ?? mon.name}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(hero ? "wp-sprite-hero" : "wp-sprite", className)}
    />
  )
}

/**
 * The pastel stage a sprite stands on: the type-derived wash, the dot screen, and
 * the shiny/legendary bloom — composed once, here, because every surface in the app
 * that shows a Pokémon (card, row, slot, thumb, cart line, order line) needs the
 * exact same stack, and hand-rolling it at each call site is how they drift apart.
 *
 * Shiny beats legendary for the bloom: a shiny legendary gets the teal burst, since
 * shiny is the rarer and more valuable fact about it.
 */
export function SpriteStage({
  mon,
  className,
  dots = true,
  children,
}: {
  mon: Pick<WpMon, "dex" | "form" | "palette" | "name" | "shiny" | "legendary" | "types">
  className?: string
  dots?: boolean
  /** Badges, fav button, level pill — anything that sits over the sprite. */
  children?: React.ReactNode
}) {
  return (
    <div className={cn("wp-wall relative flex items-center justify-center", wallClassFor(mon), className)}>
      {dots && <div className="absolute inset-0 wp-dots" />}
      {mon.shiny ? (
        <div className="absolute inset-0 wp-burst-shiny" />
      ) : mon.legendary ? (
        <div className="absolute inset-0 wp-burst-legend" />
      ) : null}
      {children}
    </div>
  )
}
