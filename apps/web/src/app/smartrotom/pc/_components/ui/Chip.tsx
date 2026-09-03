import type { ButtonHTMLAttributes, HTMLAttributes } from "react"

const SHAPE =
  "inline-flex items-center gap-1.5 rounded-pc-pill border px-[0.5625rem] py-1 font-pc text-[0.71875rem] font-semibold"

/**
 * The resting skin. It is kept apart from the shape because the lit skin has to
 * *replace* it, not layer over it: Tailwind emits the `pc-*` colours alphabetically,
 * so `bg-pc-accent/[.16]` lands before `bg-pc-panel-2` and would silently lose to it.
 */
const SKIN = "border-pc-line-strong bg-pc-panel-2 text-pc-fg-muted"

export function Chip({ className = "", ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`${SHAPE} ${SKIN} ${className}`} {...rest} />
}

export interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** A chip you can press — a smart view, a tag suggestion, a generation filter. */
export function ChipButton({ active = false, className = "", type = "button", ...rest }: ChipButtonProps) {
  return (
    <button
      type={type}
      className={[
        SHAPE,
        "cursor-pointer transition-colors focus-visible:outline-none",
        active
          ? "border-pc-accent bg-pc-accent/[.16] text-pc-fg"
          : `${SKIN} hover:border-pc-line-strong hover:text-pc-fg`,
        className,
      ].join(" ")}
      {...rest}
    />
  )
}
