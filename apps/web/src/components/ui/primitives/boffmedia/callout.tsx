"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface CalloutProps {
  icon?: string
  tone?: "accent" | "orange"
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Callout({ icon = "sparkles", tone = "accent", title, children, className, style }: CalloutProps) {
  return (
    <div className={cn("k-callout", `k-callout--${tone}`, className)} style={style}>
      <span className="k-callout__icon"><Icon name={icon} size={20} /></span>
      <div>
        {title && <p className="k-callout__title">{title}</p>}
        <div className="k-callout__text">{children}</div>
      </div>
    </div>
  )
}
