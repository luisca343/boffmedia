"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export interface BoffButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "outline"
  size?: "sm" | "lg"
  block?: boolean
  icon?: string
  iconRight?: string
  href?: string
}

const variants: Record<string, { cls: string; style: React.CSSProperties }> = {
  primary: {
    cls: "bg-orange-500 text-white border-orange-500 hover:bg-orange-400",
    style: { boxShadow: "0 8px 24px -8px var(--orange-500)" },
  },
  accent: {
    cls: "bg-secondary text-[var(--on-secondary)] border-secondary hover:brightness-110",
    style: { boxShadow: "0 8px 24px -8px var(--secondary)" },
  },
  ghost: {
    cls: "bg-transparent text-ink border-edge-strong hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]",
    style: { boxShadow: "none" },
  },
  outline: {
    cls: "bg-transparent text-orange-500 hover:bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)] hover:border-orange-500",
    style: { boxShadow: "none", borderColor: "color-mix(in srgb, var(--orange-500) 55%, transparent)" },
  },
}

export function BoffButton({
  className,
  variant = "primary",
  size,
  block,
  icon,
  iconRight,
  href,
  children,
  ...props
}: BoffButtonProps) {
  const v = variants[variant] || variants.primary
  const cls = cn(
    "inline-flex items-center justify-center gap-2.5",
    "font-body font-semibold text-sm leading-none",
    "border border-solid cursor-pointer whitespace-nowrap",
    "transition-[transform,box-shadow,background,border-color] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
    "hover:-translate-y-px active:translate-y-px",
    "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--bg),0_0_0_5px_var(--secondary-hover)]",
    v.cls,
    size === "sm" && "py-2 px-4 text-xs",
    size === "lg" && "py-4 px-8 text-base",
    block && "w-full",
    !size && "py-3.5 px-6",
    className,
  )

  const inner = (
    <>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </>
  )

  const mergedStyle = { borderRadius: "var(--btn-radius, 9999px)", ...v.style }

  if (href !== undefined) {
    return <a className={cls} style={mergedStyle} href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{inner}</a>
  }

  return <button className={cls} style={mergedStyle} {...props}>{inner}</button>
}
