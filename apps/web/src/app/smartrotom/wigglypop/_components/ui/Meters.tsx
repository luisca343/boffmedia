"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { STAT_COLORS } from "../../_utils/typeColors"
import { countdown } from "../../_utils/format"
import { Icon } from "./Icon"

/**
 * A seller's rating, 0–5. Renders `null` as nothing at all — a brand-new seller
 * genuinely has no rating, and painting five empty stars would imply a zero score
 * they never earned (derive, or defer honestly).
 */
export function Stars({
  value,
  size = 13,
  className,
}: {
  value: number | null
  size?: number
  className?: string
}) {
  const t = useTranslations("wigglypop")
  if (value === null) return null
  const full = Math.floor(value)
  return (
    <span
      className={cn("inline-flex gap-px text-wp-gold", className)}
      role="img"
      aria-label={t("common.starsAriaLabel", { value: value.toFixed(1) })}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          filled={i < full}
          className={i < full ? "" : "text-wp-line/40"}
        />
      ))}
    </span>
  )
}

/**
 * The six-cell IV strip on a card. Each cell is one stat, coloured only when that
 * IV is worth noticing: a solid cell is a perfect 31, a half-lit one is 25–30, and
 * a dead cell is anything below. That triage is the whole value of the component —
 * a buyer scanning a grid can spot a 6IV mon without reading a single number.
 */
export function IVMeter({ ivs, className }: { ivs: number[]; className?: string }) {
  const t = useTranslations("wigglypop")
  const keys = ["hp", "atk", "def", "spa", "spd", "spe"]
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} title={t("common.ivsLabel")}>
      {keys.map((k, i) => {
        const v = ivs[i] ?? 0
        const c = STAT_COLORS[k]
        return (
          <i
            key={k}
            className="block h-1.5 w-1.5 rounded-[2px]"
            style={{
              background: v === 31 ? c : v >= 25 ? `${c}99` : "rgba(60,34,54,.13)",
            }}
          />
        )
      })}
    </span>
  )
}

/** One stat's bar on the detail page. */
export function StatBar({ statKey, value, max }: { statKey: string; value: number; max: number }) {
  return (
    <div className="h-[9px] overflow-hidden rounded-wp-pill bg-wp-fg/[.08]">
      <i
        className="block h-full rounded-wp-pill"
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: STAT_COLORS[statKey],
        }}
      />
    </div>
  )
}

/**
 * An auction's remaining time, ticking. Under an hour it turns rose and counts
 * seconds — that switch is the design's urgency cue and the reason this is a live
 * component rather than a formatted string.
 */
export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const t = useTranslations("wigglypop")
  const overLabel = t("status.auctionEnded")
  const [now, setNow] = useState(() => countdown(endsAt, overLabel))

  useEffect(() => {
    setNow(countdown(endsAt, overLabel))
    const timer = setInterval(() => setNow(countdown(endsAt, overLabel)), 1000)
    return () => clearInterval(timer)
  }, [endsAt, overLabel])

  return (
    <span
      className={cn(
        "wp-num inline-flex items-center gap-1 font-wp text-[12.5px] font-black",
        now.over ? "text-wp-fg-subtle" : now.urgent ? "text-wp-rose" : "text-wp-amber",
        className,
      )}
    >
      <Icon name="clock" size={13} />
      {now.text}
    </span>
  )
}
