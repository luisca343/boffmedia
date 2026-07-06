"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"
import { useFavorites } from "./tools-store"

interface FavStarProps {
  href: string
  className?: string
}

export function FavStar({ href, className = "" }: FavStarProps) {
  const { isFav, toggle } = useFavorites()
  const on = isFav(href)

  return (
    <button
      className={
        "inline-grid place-items-center w-[34px] h-[34px] shrink-0 rounded-[var(--radius)] border border-edge bg-layer-2 text-ink-dim cursor-pointer transition-all duration-[var(--dur)] hover:text-[var(--orange-500)] hover:border-[color-mix(in_srgb,var(--orange-500)_50%,var(--border))]" +
        (on
          ? " text-[var(--orange-500)] border-[color-mix(in_srgb,var(--orange-500)_55%,var(--border))] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] [&_svg]:fill-current"
          : "") +
        (className ? " " + className : "")
      }
      aria-label={on ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation()
        toggle(href)
      }}
    >
      <Icon name="star" size={16} />
    </button>
  )
}
