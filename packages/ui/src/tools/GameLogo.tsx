"use client"

import * as React from "react"
import { cn } from "../cn"
import { hueStyle } from "./hue"

export interface GameLogoProps {
  /** Letter/wordmark drawn when there is no art (or the art fails to load). */
  label: string
  hueColor: string
  size?: "sm" | "md" | "lg"
  className?: string
  /** Real game icon. Rendered with a plain `<img>` so this package stays
   *  host-agnostic; a host with an image pipeline passes `art` instead. */
  imageSrc?: string
  /** Art slot, for a host whose framework owns image loading (Next's `Image`).
   *  Wins over `imageSrc`. */
  art?: React.ReactNode
  /** Drop the seal frame (cut, border, tinted plate) and show the bare art. */
  bare?: boolean
}

// --cut-w mirrors the border width so the redrawn chamfer strokes match it.
const SIZES = {
  sm: { box: "w-[2.125rem] h-[2.125rem] text-[0.6875rem] [--cut:6px] [--cut-w:1.5px]", border: "border-[1.5px]" },
  md: { box: "w-14 h-14 text-[0.9375rem] [--cut:9px] [--cut-w:2px]", border: "border-2" },
  lg: { box: "w-[6.5rem] h-[6.5rem] text-[1.0625rem] [--cut:9px] [--cut-w:2px]", border: "border-2" },
} as const

/** The game seal — its icon (or letter) in the game's hue, with the diagonal cut. */
export function GameLogo({ label, hueColor, size, className, imageSrc, art, bare }: GameLogoProps) {
  const dim = SIZES[size ?? "md"]
  const [failed, setFailed] = React.useState(false)
  const hasArt = art != null || (!!imageSrc && !failed)
  const framed = !(bare && hasArt)

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
      {art ??
        (imageSrc && !failed ? (
          <img src={imageSrc} alt="" className="h-full w-full object-contain" onError={() => setFailed(true)} />
        ) : (
          label
        ))}
    </span>
  )
}
