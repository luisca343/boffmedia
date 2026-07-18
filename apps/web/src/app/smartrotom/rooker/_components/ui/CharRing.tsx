"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/**
 * The 280-character ring in the composer.
 *
 * It only starts counting down in words once you are within 20 of the limit — before
 * that the arc alone is enough, and a number would be noise. Past the limit it goes red
 * and the count goes negative, which is what stops the Trinar button.
 */
export const MAX_CHARS = 280

export function CharRing({ count }: { count: number }) {
  const t = useTranslations("rooker")
  const pct = Math.min(count / MAX_CHARS, 1)
  const r = 9
  const c = 2 * Math.PI * r
  const over = count > MAX_CHARS
  const near = count > MAX_CHARS - 20

  const tone = over ? "text-rk-ball" : near ? "text-rk-choque" : "text-rk-accent"

  return (
    <div className="inline-flex items-center gap-2">
      {near && (
        <span className={cn("text-[12px] font-bold tabular-nums", tone)}>{MAX_CHARS - count}</span>
      )}
      <svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label={t("compose.charCountAriaLabel", { count, max: MAX_CHARS })}>
        <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2.4" className="stroke-rk-line-strong" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 12 12)"
          className={cn("stroke-current transition-[stroke-dashoffset] duration-150", tone)}
        />
      </svg>
    </div>
  )
}
