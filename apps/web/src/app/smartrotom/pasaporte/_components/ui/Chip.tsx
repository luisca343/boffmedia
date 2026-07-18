// PAPER. Three small printed chips.

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { rarityInfo } from "../../_utils/tiers"

/** Points, in gold leaf. The `+` carries the meaning, not the colour. */
export function PtsChip({ points, sm = false, className }: { points: number; sm?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "ps-num inline-flex flex-none items-center rounded-full bg-ps-gild/[.18] font-ps-mono font-bold text-ps-gild-lo",
        sm ? "px-1.5 py-px text-[9.5px]" : "px-[9px] py-[3px] text-[11px]",
        className,
      )}
    >
      +{points}
    </span>
  )
}

/**
 * Rarity is a real completion percentage from the API. The band and its ink both come from
 * `rarityInfo()`, whose class strings are literal; `border-current` keeps the outline on
 * the same ink as the label without a second map.
 */
export function RarityBadge({
  rarity,
  showPct = false,
  className,
}: {
  rarity: number
  showPct?: boolean
  className?: string
}) {
  const t = useTranslations("pasaporte")
  const info = rarityInfo(rarity, t)
  return (
    <span
      className={cn(
        "ps-num inline-block rounded-full border border-current px-[7px] py-[2px] font-ps-mono text-[9px] uppercase tracking-[.06em]",
        info.className,
        className,
      )}
    >
      {info.label}
      {showPct && ` · ${rarity}%`}
    </span>
  )
}

/** The circuit a medal belongs to: solid, in the chapter's deep ink. */
export function CircuitTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-ps-chapter-deep px-[9px] py-[3px] text-[10px] uppercase tracking-[.16em] text-white",
        className,
      )}
    >
      {children}
    </span>
  )
}
