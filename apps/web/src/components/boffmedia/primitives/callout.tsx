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
    <div
      className={cn(
        "flex gap-4 items-start py-4.5 px-5",
        "rounded-[var(--radius-lg,22px)]",
        "bg-[var(--surface-2)]",
        "border border-solid border-[var(--border)]",
        "border-l-[3px] border-l-[var(--accent-bright)]",
        "data-[direction=hud]:border-l-4 data-[direction=hud]:shadow-[4px_4px_0_0_var(--hud-shadow)]",
        "p-4",
        tone === "orange" && "border-l-orange-500",
        className,
      )}
      style={style}
    >
      <span className={cn(
        "shrink-0 mt-px",
        tone === "orange" ? "text-orange-500" : "text-[var(--accent-bright)]",
      )}>
        <Icon name={icon} size={20} />
      </span>
      <div>
        {title && <p className="font-bold text-base mb-1">{title}</p>}
        <div className="text-sm text-[var(--text-muted)] leading-relaxed [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-[var(--accent-bright)]">
          {children}
        </div>
      </div>
    </div>
  )
}
