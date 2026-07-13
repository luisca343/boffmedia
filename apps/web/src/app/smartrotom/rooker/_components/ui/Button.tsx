import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Rooker's button. Four intents, one shape — every control in the app is a full pill.
 *
 * `accent` hovers by *filtering* rather than by swapping the background colour. The
 * background is `rgb(var(--rk-accent))`, a live custom property, and Chromium strands
 * a colour transition whose endpoint is a var() — the button gets stuck mid-fade.
 * Brightness is applied by the compositor and sidesteps it entirely.
 *
 * `follow` is the inverse-fill button ("Seguir" is solid ink on the canvas, "Siguiendo"
 * is an outline) — Twitter's own rule, and the reason it is an intent rather than a
 * one-off: it appears in four different places.
 */
type Intent = "accent" | "follow" | "following" | "ghost"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Intent
  children: ReactNode
  block?: boolean
}

const INTENT: Record<Intent, string> = {
  accent:
    "bg-rk-accent text-rk-accent-fg transition-[filter,opacity] hover:brightness-[.92] disabled:bg-rk-line-strong disabled:text-rk-fg-subtle disabled:cursor-not-allowed disabled:hover:brightness-100",
  follow: "bg-rk-fg text-rk-bg transition-[filter] hover:brightness-90",
  following:
    "border border-rk-line-strong bg-transparent text-rk-fg transition-colors hover:border-rk-ball/40 hover:bg-rk-ball/10 hover:text-rk-ball",
  ghost: "border border-rk-line-strong bg-transparent text-rk-fg transition-colors hover:bg-rk-hover",
}

export function Button({ intent = "accent", children, block, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-rk-pill px-[18px] py-[8px]",
        "text-[14px] font-bold leading-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rk-accent",
        INTENT[intent],
        block && "w-full",
        className,
      )}
    >
      {children}
    </button>
  )
}
