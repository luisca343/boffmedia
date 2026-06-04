"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface PokeSpriteProps {
  dex: number
  name?: string
  size?: number
  variant?: "artwork" | "front"
  className?: string
}

export function PokeSprite({ dex, name = "", size = 40, variant = "artwork", className }: PokeSpriteProps) {
  const [err, setErr] = useState(false)
  const base = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
  const url = variant === "front" ? `${base}/${dex}.png` : `${base}/other/official-artwork/${dex}.png`
  if (err) {
    return (
      <span className={cn("inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
        <span
          className="inline-flex items-center justify-center rounded-full text-white font-bold text-xs"
          style={{
            width: size * 0.85,
            height: size * 0.85,
            background: `hsl(${(name.charCodeAt(0) * 47) % 360} 50% 45%)`,
          }}
        >
          {name[0] || "?"}
        </span>
      </span>
    )
  }
  return (
    <span className={cn("inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <img src={url} alt={name} onError={() => setErr(true)} style={{ width: size, height: size }} />
    </span>
  )
}
