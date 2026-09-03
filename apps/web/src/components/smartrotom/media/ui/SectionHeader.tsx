import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Standard section head: accent left-bar + eyebrow chip + display title +
 * optional subtitle + gradient rule, with an action slot on the right. Accent
 * is per-app (via `mw-accent`), so this reads correctly under either `data-app`.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  rule = true,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** the 120px accent underline (hidden when a subtitle already anchors it) */
  rule?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex items-end justify-between gap-4 pl-4",
        "before:absolute before:left-0 before:top-0.5 before:bottom-4 before:w-1",
        "before:rounded before:bg-mw-accent before:content-['']",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow != null && (
          <span className="mb-2.5 flex w-max items-center gap-1.5 whitespace-nowrap rounded-mw-pill border border-mw-accent/30 bg-mw-accent/[.14] px-2.5 py-1 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-mw-accent">
            {eyebrow}
          </span>
        )}
        <h2 className="m-0 font-mw-display text-[1.625rem] font-extrabold leading-[1.2] tracking-[-0.01em] text-mw-fg">
          {title}
        </h2>
        {subtitle != null && <p className="mt-1.5 text-sm text-mw-fg-mute">{subtitle}</p>}
        {rule && <div className="mt-3 h-[3px] w-[7.5rem] rounded-full bg-mw-accent" />}
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </div>
  )
}
