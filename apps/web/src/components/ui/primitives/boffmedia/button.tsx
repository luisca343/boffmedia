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

const variantClass: Record<string, string> = {
  primary: "btn--primary",
  accent: "btn--accent",
  ghost: "btn--ghost",
  outline: "btn--outline",
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
  const cls = cn(
    "btn",
    variantClass[variant] || "btn--primary",
    size === "sm" && "btn--sm",
    size === "lg" && "btn--lg",
    block && "btn--block",
    className
  )

  const inner = (
    <>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </>
  )

  if (href !== undefined) {
    return <a className={cls} href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{inner}</a>
  }

  return <button className={cls} {...props}>{inner}</button>
}
