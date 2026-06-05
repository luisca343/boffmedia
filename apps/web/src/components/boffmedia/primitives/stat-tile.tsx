import { cn } from "@/lib/utils"

interface StatTileProps {
  value: React.ReactNode
  label: string
  tone?: "neutral" | "pos" | "neg" | "accent"
  small?: boolean
  className?: string
}

export function StatTile({ value, label, tone = "neutral", small, className }: StatTileProps) {
  return (
    <div className={cn("bg-[var(--card-bg)] border-[var(--card-border)] rounded-[var(--radius)] px-[0.6rem] py-[0.7rem] text-center", className)}>
      <div
        className={cn(
          "font-display font-extrabold leading-[1.05] tabular-nums",
          small ? "text-base" : "text-2xl",
          tone === "neutral" && "text-[var(--text)]",
          tone === "pos" && "text-[var(--trk-win)]",
          tone === "neg" && "text-[var(--trk-loss)]",
          tone === "accent" && "text-[var(--accent-bright)]",
        )}
      >
        {value}
      </div>
      <div className="font-mono text-xs tracking-[0.1em] uppercase text-[var(--text-dim)] mt-1">{label}</div>
    </div>
  )
}
