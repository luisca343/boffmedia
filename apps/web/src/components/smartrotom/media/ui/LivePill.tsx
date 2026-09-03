import { cn } from "@/lib/utils"

/**
 * Live indicator: accent pill + pulsing white dot + the word "EN VIVO", so the
 * meaning is never colour-only. Rendered static; the parent positions it
 * (e.g. `className="absolute top-2.5 left-2.5"`) over a card or player.
 */
export function LivePill({
  size = "md",
  label = "EN VIVO",
  className,
}: {
  size?: "md" | "lg"
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 z-[2] whitespace-nowrap font-mw-display font-extrabold uppercase",
        "tracking-[0.12em] text-mw-accent-on bg-mw-accent rounded-mw-md",
        "shadow-[0_4px_12px_rgb(var(--mw-accent)/.35)]",
        size === "lg" ? "text-xs px-3 py-1.5" : "text-[0.625rem] px-2 py-1",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-mw-ping-white" />
      {label}
    </span>
  )
}
