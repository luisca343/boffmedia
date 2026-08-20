import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ArButtonVariant = "primary" | "cyan" | "amber" | "ghost" | "outline" | "danger"
export type ArButtonSize = "sm" | "md" | "lg"

export interface ArButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children?: ReactNode
  variant?: ArButtonVariant
  size?: ArButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  full?: boolean
}

// Each filled variant is a lit plastic cabinet button: a light gradient top to
// bottom, a white inner bevel on the top edge, a dark one on the bottom, and a
// wide coloured bloom underneath. The off-token gradient stops (the light and
// dark ends of each ramp) are the sanctioned multi-layer-gradient exception —
// they are not palette colours.
const VARIANT: Record<ArButtonVariant, string> = {
  primary:
    "text-white border-white/[.18] [text-shadow:0_1px_0_rgb(0_0_0/.35)] " +
    "bg-[linear-gradient(180deg,#ff5fbf_0%,rgb(var(--ar-magenta))_55%,#c4127a_100%)] " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/.35),inset_0_-2px_0_rgb(0_0_0/.35),0_8px_26px_-8px_rgb(var(--ar-magenta)/.6)]",
  cyan:
    "text-[#001016] border-white/25 " +
    "bg-[linear-gradient(180deg,rgb(var(--ar-cyan-2))_0%,rgb(var(--ar-cyan))_55%,#008faa_100%)] " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/.55),inset_0_-2px_0_rgb(0_0_0/.25),0_8px_26px_-8px_rgb(var(--ar-cyan)/.65)]",
  amber:
    "text-[#1c0e00] border-white/25 " +
    "bg-[linear-gradient(180deg,#ffd685_0%,rgb(var(--ar-amber))_55%,#b07000_100%)] " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/.55),inset_0_-2px_0_rgb(0_0_0/.3),0_8px_26px_-8px_rgb(var(--ar-amber)/.6)]",
  ghost: "bg-white/[.04] text-ar-ink border-white/10 normal-case tracking-normal",
  outline:
    "bg-transparent text-ar-cyan border-ar-cyan/45 shadow-[inset_0_0_20px_rgb(var(--ar-cyan)/.08)]",
  danger:
    "text-white border-white/[.22] " +
    "bg-[linear-gradient(180deg,#ff8794_0%,rgb(var(--ar-danger))_55%,#b3232f_100%)]",
}

const SIZE: Record<ArButtonSize, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2.5 text-[12px]",
  lg: "px-[22px] py-3.5 text-[14px]",
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  disabled,
  className,
  ...rest
}: ArButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "ar-lift inline-flex select-none items-center justify-center gap-2 rounded-lg border",
        "font-ar font-semibold uppercase tracking-[0.08em]",
        "disabled:pointer-events-none disabled:opacity-45",
        SIZE[size],
        VARIANT[variant],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
