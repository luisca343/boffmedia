"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { hueStyle } from "./tools-data"
import { ArtImage } from "./ArtImage"

export interface GameLogoProps {
  label: string
  hueColor: string
  size?: "sm" | "lg"
  className?: string
  /** Real game icon image; falls back to the letter seal if missing/broken. */
  imageSrc?: string
}

const SIZES = {
  sm: { box: "w-[34px] h-[34px] text-[11px] border-[1.5px] [--cut:6px]", px: "34px" },
  md: { box: "w-14 h-14 text-[15px] border-2 [--cut:9px]", px: "56px" },
  lg: { box: "w-[66px] h-[66px] text-[17px] border-2 [--cut:9px]", px: "66px" },
} as const

/** The game seal — its icon (or letter) in the game's hue, with the diagonal cut. */
export function GameLogo({ label, hueColor, size, className, imageSrc }: GameLogoProps) {
  const dim = SIZES[size ?? "md"]
  return (
    <span
      style={hueStyle(hueColor)}
      className={cn(
        "cut relative grid flex-none place-items-center overflow-hidden border-solid font-display font-extrabold italic uppercase leading-none tracking-[0.02em]",
        "text-[var(--ghue)] border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_12%,var(--bg))]",
        dim.box,
        className,
      )}
    >
      <ArtImage src={imageSrc} sizes={dim.px} fallback={label} />
    </span>
  )
}
