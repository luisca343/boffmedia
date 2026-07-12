import { cn } from "@/lib/utils"

/** Controlled switch (autoplay, subscribe). Parent owns the state (SRP). */
export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 flex-none rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mw-accent focus-visible:ring-offset-2 focus-visible:ring-offset-mw-bg",
        checked ? "bg-mw-accent" : "bg-mw-700",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform duration-150",
          checked && "translate-x-4",
        )}
      />
    </button>
  )
}
