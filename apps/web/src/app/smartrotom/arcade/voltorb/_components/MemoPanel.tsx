"use client"

import { cn } from "@/lib/utils"
import { Panel } from "../../_components/ui"

interface MemoPanelProps {
  memoMode: boolean
  selectedMark: number
  onToggleMemoMode: () => void
  onSelectMark: (mark: number) => void
}

// The pad, left to right: the three multipliers, then the bomb (mark 0).
const KEYS: { mark: number; glyph: string }[] = [
  { mark: 1, glyph: "1" },
  { mark: 2, glyph: "2" },
  { mark: 3, glyph: "3" },
  { mark: 0, glyph: "⚡" },
]

const KEY_STATE = {
  active: "border-ar-magenta/50 bg-ar-magenta/[.18] text-ar-magenta-2",
  idle: "border-white/10 bg-white/[.04] text-ar-ink-dim",
} as const

export default function MemoPanel({
  memoMode,
  selectedMark,
  onToggleMemoMode,
  onSelectMark,
}: MemoPanelProps) {
  return (
    <Panel tone="void" tight>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="font-ar-display text-[9px] uppercase tracking-[0.18em] text-ar-magenta-2">
          MEMO
        </span>
        <button
          type="button"
          onClick={onToggleMemoMode}
          aria-pressed={memoMode}
          className={cn(
            "ar-lift rounded-md border px-2 py-1 font-ar-mono text-[10px] font-bold uppercase tracking-[0.08em]",
            memoMode
              ? "border-ar-lime/50 bg-ar-lime/[.14] text-ar-lime"
              : "border-white/10 bg-white/[.04] text-ar-ink-muted",
          )}
        >
          {memoMode ? "Notas ON" : "Notas OFF"}
        </button>
      </div>

      <div className="flex gap-1.5">
        {KEYS.map(({ mark, glyph }) => (
          <button
            key={mark}
            type="button"
            onClick={() => onSelectMark(mark)}
            disabled={!memoMode}
            aria-pressed={memoMode && selectedMark === mark}
            aria-label={mark === 0 ? "Marcar Voltorb" : `Marcar x${mark}`}
            className={cn(
              "ar-lift h-[38px] flex-1 rounded-md border font-ar-display text-[13px]",
              "disabled:pointer-events-none disabled:opacity-45",
              memoMode && selectedMark === mark ? KEY_STATE.active : KEY_STATE.idle,
            )}
          >
            {glyph}
          </button>
        ))}
      </div>

      <p className="mt-2 font-ar-mono text-[10px] leading-relaxed text-ar-ink-muted">
        Activa <b className="text-ar-ink-dim">Notas</b> y haz clic en una casilla para marcarla sin
        voltearla.
      </p>
    </Panel>
  )
}
