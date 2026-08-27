"use client"

import * as React from "react"
import { GameLogo as UiGameLogo, type GameLogoProps as UiGameLogoProps } from "@boffmedia/ui"
import { ArtImage } from "./ArtImage"

export interface GameLogoProps extends Omit<UiGameLogoProps, "art"> {
  size?: "sm" | "md" | "lg"
}

const SIZE_PX = { sm: "34px", md: "56px", lg: "104px" } as const

/**
 * The game seal, drawn by `@boffmedia/ui` but with the art routed through
 * `next/image`.
 *
 * The package renders a plain `<img>` so a Tauri host works with no wiring; on
 * the web that would bypass the image optimiser, so the `art` slot takes an
 * `ArtImage` instead — the one difference between the two hosts.
 */
export function GameLogo({ label, hueColor, size, className, imageSrc, bare }: GameLogoProps) {
  const px = SIZE_PX[size ?? "md"]
  return (
    <UiGameLogo
      label={label}
      hueColor={hueColor}
      size={size}
      className={className}
      bare={bare}
      art={imageSrc ? <ArtImage src={imageSrc} sizes={px} fallback={label} fit="contain" /> : undefined}
    />
  )
}
