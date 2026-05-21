"use client"

import { useTranslations } from "next-intl"

const STATUS_STYLES: Record<string, { fg: string; bg: string; label: string }> = {
  caught: { fg: "#34d399", bg: "rgba(52, 211, 153, .15)", label: "status_caught" },
  seen: { fg: "#fbbf24", bg: "rgba(251, 191, 36, .15)", label: "status_seen" },
  shiny: { fg: "#f0abfc", bg: "rgba(240, 171, 252, .15)", label: "status_shiny" },
  unknown: { fg: "#97a6bb", bg: "rgba(151, 166, 187, .12)", label: "status_unknown" },
}

const SIZES = {
  sm: { h: 18, padX: 6, gap: 5, fs: 10, dot: 6 },
  md: { h: 22, padX: 8, gap: 6, fs: 11, dot: 7 },
  lg: { h: 28, padX: 11, gap: 8, fs: 13, dot: 9 },
}

export function StatusPill({
  status = "unknown",
  size = "md",
  showLabel = true,
}: {
  status?: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}) {
  const t = useTranslations("pokedex")
  const style = STATUS_STYLES[status] || STATUS_STYLES.unknown
  const s = SIZES[size]

  return (
    <span
      role="status"
      aria-label={`${t(style.label as any)}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.padX}px`,
        background: style.bg,
        color: style.fg,
        fontWeight: 600,
        fontSize: s.fs,
        letterSpacing: ".02em",
        borderRadius: 999,
        border: `1px solid ${style.fg}33`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: s.dot,
          height: s.dot,
          borderRadius: "50%",
          background: style.fg,
          boxShadow: `0 0 6px ${style.fg}`,
          flexShrink: 0,
        }}
      />
      {showLabel && t(style.label as any)}
    </span>
  )
}
