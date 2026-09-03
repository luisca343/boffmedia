import type { ReactNode } from "react"
import { Icon, type IconName } from "./Icon"

type ButtonTone = "primary" | "gold" | "danger" | "ghost" | "soft" | "plain"
type ButtonSize = "sm" | "md" | "lg" | "icon"

const TONE_CLASS: Record<ButtonTone, string> = {
  primary: "bg-gt-accent text-white border-gt-accent hover:bg-gt-accent-strong shadow-gt-sm",
  gold: "bg-gt-gold text-white border-gt-gold hover:bg-gt-gold-600 shadow-gt-sm",
  danger: "bg-gt-danger text-white border-gt-danger hover:brightness-90 shadow-gt-sm",
  ghost: "bg-gt-paper-0 text-gt-ink-700 border-gt-line-strong hover:bg-gt-paper-1 shadow-gt-sm",
  soft: "bg-gt-accent-tint text-gt-accent-strong border-transparent hover:brightness-95",
  plain: "bg-transparent text-gt-ink-600 border-transparent hover:bg-gt-paper-1",
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "px-[0.6875rem] py-1.5 text-xs gap-1.5",
  md: "px-4 py-[0.5625rem] text-[0.8125rem] gap-[0.4375rem]",
  lg: "px-[1.375rem] py-3 text-[0.90625rem] gap-2",
  icon: "p-2 text-[0.8125rem]",
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 15, lg: 16, icon: 16 }

export function Button({
  children,
  onClick,
  tone = "primary",
  size = "md",
  icon,
  iconRight,
  disabled,
  title,
  type = "button",
  className = "",
  "aria-label": ariaLabel,
}: {
  children?: ReactNode
  onClick?: () => void
  tone?: ButtonTone
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
  disabled?: boolean
  title?: string
  type?: "button" | "submit"
  className?: string
  "aria-label"?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-gt-sm border font-gt font-bold tracking-[.02em] transition-[transform,background-color,border-color,color,box-shadow] duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 motion-reduce:hover:translate-y-0 ${TONE_CLASS[tone]} ${SIZE_CLASS[size]} ${className}`}
    >
      {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
      {children}
      {iconRight && <Icon name={iconRight} size={ICON_SIZE[size]} />}
    </button>
  )
}
