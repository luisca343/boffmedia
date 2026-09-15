import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export interface ImageFallbackProps {
  /** Accessible label for the fallback when it represents a meaningful image. */
  alt?: string
  /** Use a Pokémon paw for sprites, or a neutral cube for other artwork. */
  kind?: "image" | "pokemon"
  className?: string
  style?: React.CSSProperties
  iconSize?: number
}

/** A compact, intentional replacement for an absent or broken image. */
export function ImageFallback({
  alt = "",
  kind = "image",
  className,
  style,
  iconSize = 20,
}: ImageFallbackProps) {
  const hasLabel = alt.trim().length > 0

  return (
    <span
      role={hasLabel ? "img" : undefined}
      aria-label={hasLabel ? alt : undefined}
      aria-hidden={hasLabel ? undefined : true}
      style={style}
      className={cn(
        "grid place-items-center border border-dashed border-line bg-panel-2 text-txt-dim",
        className,
      )}
    >
      <Icon name={kind === "pokemon" ? "paw" : "cube"} size={iconSize} />
    </span>
  )
}
