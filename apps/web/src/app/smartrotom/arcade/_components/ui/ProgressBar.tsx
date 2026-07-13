import { cn } from "@/lib/utils"

export type ArBarTone = "cyan" | "magenta" | "amber" | "violet" | "lime"

export interface ArProgressBarProps {
  value: number
  max: number
  tone?: ArBarTone
  /** Track height in px; the radius follows it so the bar stays a capsule. */
  height?: number
  glow?: boolean
  label?: string
}

const FILL: Record<ArBarTone, string> = {
  cyan: "bg-[linear-gradient(90deg,rgb(var(--ar-cyan)/.8),rgb(var(--ar-cyan)))] shadow-[0_0_12px_rgb(var(--ar-cyan)/.55)]",
  magenta:
    "bg-[linear-gradient(90deg,rgb(var(--ar-magenta-2)/.8),rgb(var(--ar-magenta-2)))] shadow-[0_0_12px_rgb(var(--ar-magenta-2)/.55)]",
  amber:
    "bg-[linear-gradient(90deg,rgb(var(--ar-amber)/.8),rgb(var(--ar-amber)))] shadow-[0_0_12px_rgb(var(--ar-amber)/.55)]",
  violet:
    "bg-[linear-gradient(90deg,rgb(var(--ar-violet-2)/.8),rgb(var(--ar-violet-2)))] shadow-[0_0_12px_rgb(var(--ar-violet-2)/.55)]",
  lime: "bg-[linear-gradient(90deg,rgb(var(--ar-lime)/.8),rgb(var(--ar-lime)))] shadow-[0_0_12px_rgb(var(--ar-lime)/.55)]",
}

export function ProgressBar({
  value,
  max,
  tone = "cyan",
  height = 8,
  glow = true,
  label,
}: ArProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="overflow-hidden border border-white/[.07] bg-black/50"
      style={{ height, borderRadius: height }}
    >
      <div
        className={cn(
          "h-full transition-[width] duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)]",
          FILL[tone],
          !glow && "shadow-none",
        )}
        style={{ width: `${pct}%`, borderRadius: height }}
      />
    </div>
  )
}
