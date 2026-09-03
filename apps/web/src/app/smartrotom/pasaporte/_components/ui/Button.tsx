// DESK. Navy-and-gold chrome on walnut: type is `text-ps-chrome-*`, hairlines are
// `border-ps-gild/18`. On paper these would be invisible.

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

const BASE =
  "inline-flex h-[2.375rem] items-center gap-[0.4375rem] whitespace-nowrap rounded-[10px] border font-ps text-[0.78125rem] font-semibold tracking-[.02em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-gild focus-visible:ring-offset-2 focus-visible:ring-offset-ps-desk disabled:cursor-default disabled:opacity-50"

const IDLE =
  "border-ps-gild/18 bg-white/[.03] text-ps-chrome-muted hover:border-ps-chrome-subtle hover:bg-white/[.06] hover:text-ps-chrome-fg"

// Struck gold: the label goes near-black because foil is a light surface, and a muted
// chrome grey on it would be unreadable.
const ACTIVE =
  "border-ps-gild bg-gradient-to-br from-ps-gild-hi to-ps-gild text-ps-desk-lo shadow-[0_0_14px_rgb(var(--ps-gild)/.4)] hover:from-ps-gild-hi hover:to-ps-gild-hi"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The pressed/engaged look — inspection on, ornament picked, page bookmarked. */
  active?: boolean
  children?: ReactNode
}

export function Button({ active = false, className, type = "button", children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={cn(BASE, "px-[0.8125rem]", active ? ACTIVE : IDLE, className)} {...rest}>
      {children}
    </button>
  )
}

/** The square 38px variant. `aria-label` is required — there is no visible label to read. */
export function IconButton({
  active = false,
  className,
  type = "button",
  children,
  "aria-label": ariaLabel,
  ...rest
}: ButtonProps & { "aria-label": string }) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(BASE, "w-[2.375rem] justify-center px-0", active ? ACTIVE : IDLE, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
