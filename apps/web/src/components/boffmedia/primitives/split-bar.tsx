import { cn } from "@/lib/utils"

interface SplitBarProps {
  win?: number
  loss?: number
  draw?: number
  showRate?: boolean
  height?: number
  className?: string
}

export function SplitBar({ win = 0, loss = 0, draw = 0, showRate = true, height = 8, className }: SplitBarProps) {
  const total = win + loss + draw || 1
  const decided = win + loss
  const wr = decided ? Math.round((win / decided) * 100) : null
  return (
    <div className={cn("flex items-center gap-[0.5rem] w-full", className)}>
      <div
        className="flex-1 min-w-[40px] flex rounded-[var(--radius-pill)] overflow-hidden bg-[var(--surface-3)]"
        style={{ height }}
      >
        {win > 0 && <span className="block h-full bg-[var(--trk-win)]" style={{ width: (win / total) * 100 + "%" }} />}
        {draw > 0 && <span className="block h-full bg-[var(--trk-draw)]" style={{ width: (draw / total) * 100 + "%" }} />}
        {loss > 0 && <span className="block h-full bg-[var(--trk-loss)]" style={{ width: (loss / total) * 100 + "%" }} />}
      </div>
      {showRate && (
        <span
          className={cn(
            "font-mono text-xs font-bold min-w-[34px] text-right text-[var(--text-muted)]",
            wr != null && wr >= 50 && "text-[var(--trk-win)]",
            wr != null && wr < 50 && "text-[var(--trk-loss)]",
          )}
        >
          {wr != null ? wr + "%" : "—"}
        </span>
      )}
    </div>
  )
}
