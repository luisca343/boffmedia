"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface IconButtonProps {
  icon?: string
  label: string
  dot?: boolean
  bordered?: boolean
  active?: boolean
  href?: string
  onClick?: (e: React.MouseEvent) => void
  size?: number
  className?: string
  children?: React.ReactNode
}

export function IconButton({ icon, label, dot = false, bordered = false, active = false, href, onClick, size = 18, className = "", children, ...rest }: IconButtonProps) {
  const cls = [
    "inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius,var(--radius-pill,9999px))] cursor-pointer relative transition-all duration-[var(--dur,0.32s)] ease-[var(--ease,cubic-bezier(.22,1,.36,1))]",
    bordered ? "border border-[var(--border-strong)]" : "border border-transparent",
    active ? "text-[var(--orange-500)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)]" : "text-[var(--text-muted)] bg-transparent hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]",
    bordered && !active ? "hover:border-[var(--orange-500)] hover:text-[var(--orange-500)]" : "",
    className,
  ].filter(Boolean).join(" ")

  const inner = (
    <>
      {children || (icon ? <Icon name={icon} size={size} /> : null)}
      {dot && <span className="absolute top-[8px] right-[9px] w-[6px] h-[6px] rounded-full bg-[var(--orange-500)] border-2 border-[var(--bg)]" />}
    </>
  )

  if (href !== undefined) {
    return <a className={cls} href={href} aria-label={label} onClick={onClick} {...rest}>{inner}</a>
  }
  return <button className={cls} aria-label={label} onClick={onClick} type="button" {...rest}>{inner}</button>
}
