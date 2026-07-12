"use client"

interface SpinnerItemProps {
  name: string
  index: number
  isWinningItem: boolean
  spinComplete: boolean
}

// cut-seal chamfer (top-left + bottom-right) — the v3 idiom for identity glyphs.
const SEAL = "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)"
// cut-corner (beveled top-right) — the v3 idiom for cards/panels.
const CARD = "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%)"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function SpinnerItem({ name, isWinningItem, spinComplete }: SpinnerItemProps) {
  const showWin = isWinningItem && spinComplete
  const initials = getInitials(name)

  return (
    <div
      // width 180 + mx 10*2 = 200px, matching the hook's ITEM_WIDTH (do not change)
      className={
        "relative mx-[10px] flex h-64 w-[180px] flex-none flex-col items-center justify-center p-4 transition-all duration-500 " +
        (showWin
          ? "scale-[1.06] border border-accent bg-accent-soft"
          : "border border-line-2 bg-panel-2")
      }
      style={{
        clipPath: CARD,
        boxShadow: showWin
          ? "0 0 30px color-mix(in srgb, var(--accent) 34%, transparent), 0 0 80px color-mix(in srgb, var(--accent) 14%, transparent)"
          : "none",
      }}
    >
      {/* winner backdrop glow */}
      {showWin && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-[bm-pulse_1.5s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)" }}
        />
      )}

      {/* initials seal */}
      <div
        className={
          "mb-3 grid h-20 w-20 select-none place-items-center border font-display text-2xl font-extrabold not-italic " +
          (showWin ? "border-accent-line bg-accent text-accent-ink" : "border-line-2 bg-base-deep text-txt-muted")
        }
        style={{
          clipPath: SEAL,
          letterSpacing: initials.length > 1 ? "-0.03em" : "0",
        }}
      >
        {initials}
      </div>

      {/* name */}
      <p
        className={
          "max-w-full truncate px-2 text-center font-mono text-xs font-medium tracking-[0.02em] " +
          (showWin ? "text-accent" : "text-txt-muted")
        }
      >
        {name}
      </p>

      {/* winner tag */}
      {showWin && (
        <span className="mt-2 animate-[bm-fade_0.3s_ease-out] bg-accent px-[10px] py-[2px] font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink motion-reduce:animate-none">
          Ganador
        </span>
      )}
    </div>
  )
}
