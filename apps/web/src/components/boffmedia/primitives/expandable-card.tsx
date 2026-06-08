"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface ExpandableCardProps {
  header: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  className?: string
  headerClassName?: string
  bodyClassName?: string
}

export function ExpandableCard({
  header,
  children,
  defaultOpen = false,
  onToggle,
  className,
  headerClassName,
  bodyClassName,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const toggle = () => {
    const next = !open
    setOpen(next)
    onToggle?.(next)
  }

  return (
    <div className={cn("border border-[var(--border)] rounded-[var(--radius)] overflow-hidden", className)}>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 bg-transparent border-none cursor-pointer text-left",
          "hover:bg-[color-mix(in_srgb,var(--surface-3)_40%,transparent)] transition-colors",
          headerClassName,
        )}
      >
        <div className="flex-1 min-w-0">{header}</div>
        <Icon
          name="chevron"
          size={14}
          className="text-[var(--text-dim)] shrink-0 transition-transform duration-[var(--dur)] ease-[var(--ease)]"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className={cn("border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_30%,transparent)] px-3 py-3", bodyClassName)}>
          {children}
        </div>
      )}
    </div>
  )
}
