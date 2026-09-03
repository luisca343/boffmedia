"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Wigglypop's button. Four variants, and the split matters:
 *
 * · `primary` — the pink gradient. Exactly ONE per view, on the action that view
 *   exists for (Comprar, Publicar, Pagar). Two primaries on a screen and neither reads.
 * · `default` — white, 1.5px plum border. Everything else.
 * · `ghost`  — no chrome until hovered. Back links, dismissals, table row actions.
 * · `danger` — reveals rose on hover only. Destructive, and never pre-alarming.
 *
 * The press is a scale-down on the bouncy ease (`ease-wp`, which overshoots). That
 * squish is the system's whole personality — it is why the buttons feel inflated.
 */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost" | "danger"
  /** Square, for an icon on its own. Always pair with an `aria-label`. */
  iconOnly?: boolean
  children?: ReactNode
}

const VARIANT = {
  default:
    "bg-white border-wp-line/46 text-wp-fg shadow-wp-btn hover:bg-[#fff5fa] hover:border-wp-accent hover:text-wp-accent-strong",
  primary:
    "wp-grad-primary border-transparent text-white shadow-wp-primary hover:brightness-[1.04]",
  ghost:
    "bg-transparent border-transparent text-wp-fg shadow-none hover:bg-wp-panel-2",
  danger:
    "bg-white border-wp-line/46 text-wp-fg shadow-wp-btn hover:bg-wp-rose/[.14] hover:border-wp-rose/50 hover:text-wp-rose",
} as const

export function Button({
  variant = "default",
  iconOnly = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-wp-sm border-wp font-wp text-[0.84375rem] font-extrabold",
        "transition-[transform,background,border-color,box-shadow,filter] duration-150 ease-wp",
        "hover:-translate-y-px active:translate-y-0 active:scale-[.98] motion-reduce:transform-none",
        "disabled:pointer-events-none disabled:opacity-45",
        iconOnly ? "p-[0.5625rem]" : "px-[0.9375rem] py-[0.5625rem]",
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
