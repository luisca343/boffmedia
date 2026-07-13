import type { RowColInfo } from "../types"

export interface HintCellProps {
  info?: RowColInfo
  /** Announced to screen readers, since the tile itself is two bare figures. */
  label: string
}

/**
 * The points/bombs readout at the head of a row or column — the only information
 * the player ever gets about what is under the tiles.
 */
export default function HintCell({ info, label }: HintCellProps) {
  const coins = info?.coins ?? 0
  const voltorbs = info?.voltorbs ?? 0
  return (
    <div
      aria-label={`${label}: ${coins} puntos, ${voltorbs} voltorbs`}
      className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgb(255_255_255/.04),transparent)] py-1 font-ar-mono"
    >
      <span aria-hidden className="text-[13px] font-bold leading-tight tabular-nums text-ar-ink">
        {coins}
      </span>
      <span
        aria-hidden
        className="flex items-center leading-none tabular-nums text-ar-magenta-2 text-[11px]"
      >
        ⚡{voltorbs}
      </span>
    </div>
  )
}
