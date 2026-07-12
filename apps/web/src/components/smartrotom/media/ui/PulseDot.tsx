import { cn } from "@/lib/utils"

/** Small pulsing dot in the per-app accent (live channel / viewer indicator). */
export function PulseDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full bg-mw-accent align-middle",
        "shadow-[0_0_0_0_rgb(var(--mw-accent)/.7)] animate-mw-ping",
        className,
      )}
    />
  )
}
