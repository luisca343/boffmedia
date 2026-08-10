import * as React from "react"
import { cn } from "../cn"
import { getLink } from "../i18n"
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

// Colours travel as --cut-line / --cut-fill rather than border-*/bg-*: the shape
// is a `.cut-frame`, so the stroke is painted geometry, not a CSS border.
const VARIANTS: Record<string, string> = {
  default: "[--cut-line:var(--line-2)] text-txt hover:[--cut-line:var(--accent)] hover:text-accent-bright",
  pri: "[--cut-line:var(--accent)] [--cut-fill:var(--accent)] text-accent-ink hover:[--cut-line:var(--accent-bright)] hover:[--cut-fill:var(--accent-bright)]",
  ghost: "[--cut-line:transparent] [--cut-fill:transparent] text-txt-muted hover:text-accent-bright",
  danger: "[--cut-line:var(--bad)] text-bad hover:[--cut-fill:var(--bad)] hover:text-white",
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
    "cut-frame [--cut-w:2px] [--cut-fill:var(--bg)]",
    "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap select-none",
    // line-height pinned to 1 via the `/none` token: a bare `leading-none` is
    // stripped by tailwind-merge when it sits next to an arbitrary `text-[..px]`.
    "font-display font-bold not-italic uppercase tracking-[0.1em] text-[15px]/none",
    "text-txt no-underline",
    "transition-[color,transform] duration-[140ms] active:translate-y-px",
    "before:transition-[background] before:duration-[140ms] after:transition-[background] after:duration-[140ms]",
    VARIANTS[variant] || VARIANTS.default,
    // Paddings absorb --cut-w, which the old `border-2` used to contribute to the
    // box: the rendered size is unchanged from the bordered version.
    size === "sm" && "[--cut:7px] py-[11px] px-[18px] text-[13px]/none",
    size === "lg" && "py-[19px] px-[36px] text-[17px]/none",
    !size && "py-[15px] px-[28px]",
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
      const HostLink = getLink()
      return (
        <HostLink data-btn className={cls} href={href} {...aProps}>
          {inner}
        </HostLink>
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
