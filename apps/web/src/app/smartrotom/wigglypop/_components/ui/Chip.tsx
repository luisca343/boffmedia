"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { WpRarity } from "../../_types/market.types"
import { RARITY_LABEL_KEY, RARITY_TEXT } from "../../_utils/rarity"

/** The default pill: sunken pink tint, plum hairline, muted text. */
export function Chip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-wp-pill border border-wp-line/24 bg-wp-panel-2",
        "px-2.5 py-1 font-wp text-[0.71875rem] font-extrabold text-wp-fg-muted",
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * The rarity word. Text-only, no container — it is deliberately quieter than the
 * strip along the card's top edge, because on a grid of 60 cards a boxed badge on
 * every one turns into noise. Colour alone carries the tier here, but never *only*
 * colour: the word is always spelled out.
 */
export function RarityBadge({ rarity, className }: { rarity: WpRarity; className?: string }) {
  const t = useTranslations("wigglypop")
  return (
    <span
      className={cn(
        "font-wp text-[0.65625rem] font-black uppercase tracking-[.04em]",
        RARITY_TEXT[rarity],
        className,
      )}
    >
      {t(RARITY_LABEL_KEY[rarity])}
    </span>
  )
}

/**
 * The badges that sit ON a card's artwork (top-left stack). Loud on purpose — these
 * are the three things a buyer scans a grid for.
 */
export function CornerBadge({
  tone,
  children,
  className,
}: {
  tone: "shiny" | "legend" | "neutral" | "accent"
  children: ReactNode
  className?: string
}) {
  const TONE = {
    shiny: "bg-wp-teal text-white",
    // Dark-brown text, not white: white on gold fails contrast badly.
    legend: "bg-wp-gold text-[#5a3c00]",
    neutral: "border border-wp-line/24 bg-white text-wp-fg-muted",
    accent: "bg-wp-accent text-white",
  } as const

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-wp-pill px-2.5 py-1",
        "font-wp text-[0.65625rem] font-black tracking-[.02em]",
        "shadow-[0_4px_10px_-4px_rgba(120,70,100,.4)]",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
