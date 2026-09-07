"use client"

import { useState } from "react"
import { Icon } from "@boffmedia/ui"
import { itemIconStyle } from "../../../teambuilder/item-icon"

const ITEM_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites/itemicons/"

/** Showdown's item icon sheet mirrors the item names returned by Smogon. */
export function itemSpriteUrl(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${ITEM_SPRITE_BASE}${slug}.png`
}

export function MvItemSprite({ name, size = 30 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const style = itemIconStyle(name)

  if (style) {
    return <span aria-hidden className="block flex-none" style={{ ...style, width: size, height: size }} />
  }

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className="grid flex-none place-items-center text-txt-dim"
        style={{ width: size, height: size }}
      >
        <Icon name="layers" size={Math.max(14, Math.round(size * 0.55))} />
      </span>
    )
  }

  return (
    <img
      src={itemSpriteUrl(name)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="block flex-none [image-rendering:pixelated]"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
