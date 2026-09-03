import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

export type ArRingTone = "cyan" | "amber" | "magenta" | "violet"

export interface RingProps {
  /** Drawn in the middle of the ring — a day number, a count, a glyph. */
  label: ReactNode
  value: number
  max: number
  size?: number
  tone?: ArRingTone
  /** Screen-reader description; the ring is a progress readout, not decoration. */
  title: string
}

const TONE: Record<ArRingTone, string> = {
  cyan: "rgb(var(--ar-cyan))",
  amber: "rgb(var(--ar-amber))",
  magenta: "rgb(var(--ar-magenta-2))",
  violet: "rgb(var(--ar-violet-2))",
}

/** The HUD's progress dial: a glowing arc with a figure at its centre. */
export function Ring({ label, value, max, size = 46, tone = "cyan", title }: RingProps) {
  const t = useTranslations("arcade")
  const stroke = 3
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const color = TONE[tone]

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={t("common.ringAria", { title, value, max })}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / .1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: "stroke-dashoffset .8s ease", filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-ar-display text-[0.6875rem] text-ar-ink">{label}</span>
      </div>
    </div>
  )
}
