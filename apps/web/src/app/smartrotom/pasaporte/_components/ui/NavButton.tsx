// DESK. The page-turn control that sits under the book, on the walnut.

import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface NavButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string
}

/**
 * A stamped navy disc with a gold rim. Disabled it loses the rim, the lift and the foil
 * — the end of the book is a physical fact, so the button stops looking like metal
 * rather than merely dimming.
 */
export function NavButton({ className, type = "button", children, ...rest }: NavButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border transition-[filter,background-color] duration-200",
        "border-ps-gild/40 bg-gradient-to-br from-ps-navy to-ps-navy-deep text-ps-gild-hi",
        "shadow-[0_2px_6px_rgba(0,0,0,.4)] hover:brightness-125",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-gild focus-visible:ring-offset-2 focus-visible:ring-offset-ps-desk",
        "disabled:cursor-default disabled:border-ps-desk disabled:bg-none disabled:bg-ps-desk-hi",
        "disabled:text-ps-chrome-subtle disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
