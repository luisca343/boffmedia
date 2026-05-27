"use client"

import { useState } from "react"

export type CravatarVariant = "face" | "head3d"

interface CravatarHeadProps {
  username?: string
  size?: number
  variant?: CravatarVariant
  style?: React.CSSProperties
}

const FALLBACK = "steve"

function buildUrl(username: string, size: number, variant: CravatarVariant): string {
  const endpoint = variant === "head3d" ? "head" : "helmhead"
  return `https://cravatar.eu/${endpoint}/${username}/${size}.png`
}

export function CravatarHead({ username, size = 32, variant = "face", style }: CravatarHeadProps) {
  const [errored, setErrored] = useState(false)
  const name = errored || !username ? FALLBACK : username
  const src = buildUrl(name, size, variant)

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => { if (!errored) setErrored(true) }}
      style={{
        imageRendering: variant === "face" ? "pixelated" : "auto",
        display: "block",
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
