"use client"

import Image from "next/image"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "../../_components/ui"
import type { ArTone } from "../../_components/ui"

export interface BoxArtProps {
  boxId: string
  size: number
  tone: ArTone
  className?: string
}

const FALLBACK_TONE: Record<ArTone, string> = {
  cyan: "border-ar-cyan/50 bg-ar-cyan/[.08] text-ar-cyan",
  magenta: "border-ar-magenta/50 bg-ar-magenta/[.08] text-ar-magenta-2",
  violet: "border-ar-violet/50 bg-ar-violet/[.08] text-ar-violet-2",
  amber: "border-ar-amber/50 bg-ar-amber/[.08] text-ar-amber",
  lime: "border-ar-lime/50 bg-ar-lime/[.08] text-ar-lime",
  ghost: "border-white/15 bg-white/[.04] text-ar-ink-muted",
}

/**
 * Box artwork with a neon crate as the fallback.
 *
 * The lootbox config names an image for all three boxes but only `trainer_box.png`
 * ships in `public/` — `evolution_box` and `battle_box` 404. A missing sprite
 * degrades to the crate glyph in the box's own accent rather than rendering a
 * broken image. Drop the two PNGs in and the art comes back on its own. See
 * docs/smartrotom/deferred/arcade.md.
 */
export function BoxArt({ boxId, size, tone, className }: BoxArtProps) {
  const t = useTranslations("arcade")
  const [broken, setBroken] = useState(false)
  const file = boxId.split(":")[1] || boxId

  if (broken) {
    return (
      <div
        className={cn("grid place-items-center rounded-2xl border", FALLBACK_TONE[tone], className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={t("loot.boxArtAria")}
      >
        <Icon.Box s={Math.round(size * 0.5)} />
      </div>
    )
  }

  return (
    <Image
      alt=""
      width={size}
      height={size}
      src={`/smartrotom/img/apps/arcade/lootbox/${file}.png`}
      onError={() => setBroken(true)}
      style={{ imageRendering: "pixelated" }}
      className={className}
    />
  )
}
