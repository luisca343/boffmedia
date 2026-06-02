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
    <div className={cn("flex flex-col items-center text-center gap-4 py-16 px-4", className)}>
      <IconBox icon={icon} size="lg" tone="muted" />
      <h3 className="text-xl">{title}</h3>
      {sub && <p className="text-[var(--text-muted)] max-w-[40ch]">{sub}</p>}
      {action}
    </div>
  )
}
