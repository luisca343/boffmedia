import { forwardRef, type ButtonHTMLAttributes } from "react"

type Variant = "default" | "primary" | "ghost" | "danger"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Square, for a lone glyph. Always pair with an `aria-label`. */
  icon?: boolean
  /** Lit state — a toggle that is currently on. */
  active?: boolean
  /**
   * The lit skin, when the accent is the wrong tone (multi-select is cyan everywhere).
   * Pass a full border/background/text trio — it *replaces* the variant, so a partial
   * one would leave the element with no background at all.
   */
  activeClass?: string
}

const BASE =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-pc-sm border font-pc text-[13.5px] font-semibold " +
  "transition-[transform,background-color,border-color,box-shadow] duration-150 " +
  "active:translate-y-px active:scale-[.99] disabled:pointer-events-none disabled:opacity-40 " +
  "focus-visible:outline-none"

const VARIANTS: Record<Variant, string> = {
  default: "border-pc-line-strong bg-pc-panel-2 text-pc-fg hover:bg-[rgb(50_66_94_/_.7)]",
  primary:
    "border-transparent bg-gradient-to-b from-pc-accent to-pc-accent-strong text-white " +
    "shadow-[0_6px_18px_-8px_rgb(47_123_240_/_.9)] hover:brightness-110",
  ghost: "border-transparent bg-transparent text-pc-fg hover:bg-pc-panel-2",
  danger:
    "border-pc-line-strong bg-pc-panel-2 text-pc-fg " +
    "hover:border-pc-rose/50 hover:bg-pc-rose/[.18] hover:text-pc-rose",
}

/**
 * Lit toggles borrow the accent. This *replaces* the variant's skin rather than
 * layering over it: Tailwind emits the `pc-*` colours alphabetically, so
 * `border-pc-accent` lands before `border-pc-line-strong` in the stylesheet and would
 * lose to it — a lit toggle would render identical to an unlit one. Only one
 * border/background/text colour class is ever on the element, so order cannot decide.
 */
const ACTIVE = "border-pc-accent bg-pc-accent/[.16] text-pc-accent"

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "default",
    icon = false,
    active = false,
    activeClass = ACTIVE,
    className = "",
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        BASE,
        icon ? "justify-center p-[9px]" : "px-[14px] py-[9px]",
        active ? activeClass : VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  )
})
