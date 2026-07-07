import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "pri" | "ghost" | "danger"
  size?: "sm" | "lg"
  icon?: string
  iconRight?: string
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
  const cut = size === "sm" ? "7px" : "10px"
  const iconSize = size === "sm" ? 14 : 16
  const cls = cn(
    "sn-btn",
    variant === "pri" && "sn-btn--pri",
    "[clip-path:polygon(var(--cut)_0,100%_0,calc(100%_-_var(--cut))_100%,0_100%)]",
    "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap select-none",
    // line-height pinned to 1 via the `/none` token: a bare `leading-none` is
    // stripped by tailwind-merge when it sits next to an arbitrary `text-[..px]`.
    "font-display font-bold not-italic uppercase tracking-[0.1em] text-[15px]/none",
    "border-2 border-solid text-txt no-underline",
    "transition-[background,border-color,color,transform] duration-[140ms] active:translate-y-px",
    VARIANTS[variant] || VARIANTS.default,
    size === "sm" && "py-[9px] px-4 text-[13px]/none",
    size === "lg" && "py-[17px] px-[34px] text-[17px]/none",
    !size && "py-[13px] px-[26px]",
    (disabled || loading) && "opacity-45 pointer-events-none",
    loading && "cursor-default",
    className,
  )

  const inner = (
    <>
      {loading && (
        <span
          className="absolute top-1/2 left-1/2 -mt-2 -ml-2 h-4 w-4 rounded-full border-2 border-current border-r-transparent opacity-90 animate-[bm-spin_0.66s_linear_infinite]"
          aria-hidden="true"
        />
      )}
      <span className={cn("inline-flex items-center justify-center gap-2.5", loading && "invisible")}>
        {icon && <Icon name={icon} size={iconSize} />}
        {children}
        {iconRight && <Icon name={iconRight} size={iconSize} />}
      </span>
    </>
  )

  const style = { ["--cut"]: cut } as React.CSSProperties

  if (href !== undefined && !loading) {
    return (
      <a className={cls} style={style} href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    )
  }

  return (
    <button
      className={cls}
      style={style}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {inner}
    </button>
  )
}
