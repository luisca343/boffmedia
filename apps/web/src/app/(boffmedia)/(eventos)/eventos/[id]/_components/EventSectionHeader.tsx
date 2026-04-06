"use client"

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventSectionHeaderProps {
  /** Section label rendered in Orbitron */
  label: string
  /** Small monospace subtitle below the label */
  sub?: string
  /** Optional badge/chip rendered on the right side */
  badge?: React.ReactNode
  /** CSS color for the left accent bar. Defaults to primary orange. */
  accentColor?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventSectionHeader({
  label,
  sub,
  badge,
  accentColor = "rgba(249,115,22,0.6)",
}: EventSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Left accent bar */}
      <div
        className="h-5 w-[3px] rounded-full flex-shrink-0"
        style={{ background: accentColor }}
      />

      {/* Title + subtitle */}
      <div className="flex-1">
        <h2
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)" }}
        >
          {label}
        </h2>
        {sub && (
          <p className="text-[10px] font-mono text-surface-500 mt-0.5">{sub}</p>
        )}
      </div>

      {/* Right badge */}
      {badge && <div className="flex-shrink-0">{badge}</div>}
    </div>
  )
}
