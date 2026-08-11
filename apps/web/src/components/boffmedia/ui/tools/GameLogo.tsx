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
  /** Drop the seal frame (cut, border, tinted plate) and show the bare icon. */
  bare?: boolean
}

// --cut-w mirrors the border width so the redrawn chamfer strokes match it.
const SIZES = {
  sm: { box: "w-[34px] h-[34px] text-[11px] [--cut:6px] [--cut-w:1.5px]", border: "border-[1.5px]", px: "34px" },
  md: { box: "w-14 h-14 text-[15px] [--cut:9px] [--cut-w:2px]", border: "border-2", px: "56px" },
  lg: { box: "w-[104px] h-[104px] text-[17px] [--cut:9px] [--cut-w:2px]", border: "border-2", px: "104px" },
} as const

/** The game seal — its icon (or letter) in the game's hue, with the diagonal cut. */
export function GameLogo({ label, hueColor, size, className, imageSrc, bare }: GameLogoProps) {
  const dim = SIZES[size ?? "md"]
  const framed = !(bare && imageSrc)
  return (
    <span
      style={hueStyle(hueColor)}
      className={cn(
        "relative grid flex-none place-items-center font-display font-extrabold italic uppercase leading-none tracking-[0.02em] text-[var(--ghue)]",
        // No overflow-hidden when framed: the clip-path already clips the art,
        // and overflow would trim the chamfer strokes off their own corners.
        !framed && "overflow-hidden",
        framed && [
          dim.border,
          "cut-seal cut-seal-edge [--cut-line:color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] border-solid border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_12%,var(--bg))]",
        ],
        dim.box,
        className,
      )}
    >
      <ArtImage src={imageSrc} sizes={dim.px} fallback={label} fit="contain" />
    </span>
  )
}
