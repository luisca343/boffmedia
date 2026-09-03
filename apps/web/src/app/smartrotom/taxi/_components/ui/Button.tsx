import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

const BASE =
  "inline-flex items-center justify-center gap-[0.5625rem] whitespace-nowrap transition-[transform,filter,background,color,border-color] duration-150 ease-tx " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tx-bg-1 " +
  "disabled:pointer-events-none disabled:opacity-55"

/**
 * The taxi's buttons. Exactly one `primary` is allowed per surface, and it is always the
 * one that spends money — the amber fill IS the money signal in this system, so a second
 * one on the same screen reads as a second charge.
 */
const VARIANTS = {
  // Pay-and-go. Amber gradient, amber glow, dark ink.
  primary:
    "flex-1 rounded-tx-md px-4 py-[0.875rem] text-[0.9375rem] font-extrabold bg-gradient-to-br from-tx-accent to-tx-accent-deep text-tx-on-accent shadow-tx-glow hover:brightness-105 hover:-translate-y-px active:translate-y-0 active:scale-[.99]",
  // The same shape without the spend — "top up", "cancel to a surface".
  secondary:
    "flex-1 rounded-tx-md px-4 py-[0.875rem] text-[0.9375rem] font-extrabold bg-tx-surface-2 border border-solid border-tx-line-2 text-tx-txt hover:brightness-110",
  // The quiet half of a two-button row.
  quiet:
    "rounded-tx-md px-4 py-[0.875rem] text-sm font-bold bg-tx-surface border border-solid border-tx-line text-tx-txt hover:bg-tx-surface-2",
  // Square, icon-only, sits beside a primary.
  ghost:
    "w-[3.125rem] shrink-0 rounded-tx-md bg-tx-surface border border-solid border-tx-line text-tx-txt-2 hover:bg-tx-surface-2 hover:text-tx-txt",
} as const

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: { variant?: keyof typeof VARIANTS } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(BASE, VARIANTS[variant], className)} {...props}>
      {children}
    </button>
  )
}

/** A round icon button — the top bar's controls, a card's close affordance. */
export function IconButton({
  label,
  className,
  children,
  ...props
}: { label: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-[2.375rem] w-[2.375rem] shrink-0 place-items-center rounded-tx-pill",
        "bg-tx-surface border border-solid border-tx-line text-tx-txt-2",
        "transition-[background,color,transform] duration-150 ease-tx",
        "hover:bg-tx-surface-2 hover:text-tx-txt active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tx-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
