"use client"

import { cn } from "@/lib/utils"
import { IconBox } from "./icon-box"

interface EmptyStateProps {
  icon?: string
  title: string
  sub?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon = "search", title, sub, action, className }: EmptyStateProps) {
  return (
    <div className={cn("empty", className)}>
      <IconBox icon={icon} size="lg" tone="muted" />
      <h3 className="empty__title">{title}</h3>
      {sub && <p className="text-muted empty__sub">{sub}</p>}
      {action}
    </div>
  )
}
