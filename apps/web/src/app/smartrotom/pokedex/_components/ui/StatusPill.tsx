import { useTranslations } from "next-intl"
import { STATUS_META, type DexStatus } from "../../_utils/dexMeta"

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
  status?: DexStatus | string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}) {
  const t = useTranslations("pokedex")
  const meta = STATUS_META[status as DexStatus] ?? STATUS_META.unknown
  const label = t(meta.labelKey)
  const s = SIZES[size]

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center font-semibold whitespace-nowrap"
      style={{
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.padX}px`,
        background: meta.bg,
        color: meta.fg,
        fontSize: s.fs,
        letterSpacing: ".02em",
        borderRadius: 999,
        border: `1px solid ${meta.fg}33`,
      }}
    >
      <span
        style={{
          width: s.dot,
          height: s.dot,
          borderRadius: "50%",
          background: meta.fg,
          boxShadow: `0 0 6px ${meta.fg}`,
          flexShrink: 0,
        }}
      />
      {showLabel && label}
    </span>
  )
}
