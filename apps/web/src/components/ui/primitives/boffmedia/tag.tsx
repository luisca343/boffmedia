"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface TagProps {
  children: React.ReactNode
  tone?: "neutral" | "accent" | "orange"
  onRemove?: () => void
  className?: string
}

export function Tag({ children, tone = "neutral", onRemove, className }: TagProps) {
  return (
    <span className={cn("k-tag", `k-tag--${tone}`, className)}>
      {children}
      {onRemove && (
        <button className="k-tag__x" aria-label="Quitar" onClick={onRemove}>
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  )
}
