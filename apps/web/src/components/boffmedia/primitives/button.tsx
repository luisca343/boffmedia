import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./icon"
import { Spinner } from "./spinner"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "pri" | "ghost" | "danger"
  size?: "sm" | "lg"
  icon?: IconName
  iconRight?: IconName
  loading?: boolean
  href?: string
}

const VARIANTS: Record<string, string> = {
  default: "border-line-2 text-txt hover:border-accent hover:text-accent-bright",
  pri: "bg-accent border-accent text-accent-ink hover:bg-accent-bright hover:border-accent-bright",
  ghost: "border-transparent text-txt-muted hover:text-accent-bright hover:border-transparent",
  danger: "border-bad text-bad hover:bg-bad hover:text-white hover:border-bad",
}

export function Button({
  className,
  variant = "default",
  size,
  icon,
  iconRight,
  loading,
  href,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : 16
  const cls = cn(
    "cut",
    "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap select-none",
    // line-height pinned to 1 via the `/none` token: a bare `leading-none` is
    // stripped by tailwind-merge when it sits next to an arbitrary `text-[..px]`.
    "font-display font-bold not-italic uppercase tracking-[0.1em] text-[15px]/none",
    "border-2 border-solid text-txt no-underline",
    "transition-[background,border-color,color,transform] duration-[140ms] active:translate-y-px",
    VARIANTS[variant] || VARIANTS.default,
    size === "sm" && "[--cut:7px] py-[9px] px-4 text-[13px]/none",
    size === "lg" && "py-[17px] px-[34px] text-[17px]/none",
    !size && "py-[13px] px-[26px]",
    (disabled || loading) && "opacity-45 pointer-events-none",
    loading && "cursor-default",
    className,
  )

  const inner = (
    <>
      {loading && <Spinner aria-hidden="true" className="absolute top-1/2 left-1/2 -mt-2 -ml-2" />}
      <span className={cn("inline-flex items-center justify-center gap-2.5", loading && "invisible")}>
        {icon && <Icon name={icon} size={iconSize} />}
        {children}
        {iconRight && <Icon name={iconRight} size={iconSize} />}
      </span>
    </>
  )

  if (href !== undefined && !loading) {
    const aProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>
    if (href.startsWith("/")) {
      return (
        <Link data-btn className={cls} href={href} {...aProps}>
          {inner}
        </Link>
      )
    }
    return (
      <a data-btn className={cls} href={href} {...aProps}>
        {inner}
      </a>
    )
  }

  return (
    <button data-btn className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {inner}
    </button>
  )
}
