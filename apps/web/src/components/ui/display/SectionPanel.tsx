import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionPanelProps {
  title: string
  children: React.ReactNode
  fullWidth?: boolean
  className?: string
  contentClassName?: string
}

/**
 * A glassmorphism-style labeled panel for grouping related content.
 * Designed for gaming-UI layouts: dark background, accent bar, hover glow.
 *
 * Use `fullWidth` in a 2-column grid to span both columns.
 */
export function SectionPanel({
  title,
  children,
  fullWidth = false,
  className,
  contentClassName,
}: SectionPanelProps) {
  return (
    <div className={cn(fullWidth ? "col-span-1 md:col-span-2" : "", className)}>
      <div className="group relative flex flex-col bg-layer-1/70 backdrop-blur-sm rounded-xl h-full border border-edge/50 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Hover top accent glow */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-edge/50">
          <span className="w-[3px] h-5 rounded-full bg-gradient-to-b from-primary-hover to-primary-active flex-shrink-0 shadow-[0_0_8px_1px_rgb(var(--primary-500)/0.35)]" />
          <h2 className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink">{title}</h2>
        </div>
        {/* Content */}
        <div className={cn("p-5 flex-1", contentClassName)}>{children}</div>
      </div>
    </div>
  )
}
