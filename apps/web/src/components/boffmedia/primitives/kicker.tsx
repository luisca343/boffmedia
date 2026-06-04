"use client"

import { cn } from "@/lib/utils"

interface KickerProps {
  children: React.ReactNode
  className?: string
}

export function Kicker({ children, className }: KickerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs tracking-[var(--label-spacing,0.22em)] uppercase",
        "text-[var(--accent-bright,var(--cyan-400))]",
        "before:block before:h-[var(--hairline,1px)] before:w-5 before:bg-[var(--accent-bright,var(--cyan-400))]",
        className,
      )}
    >
      {children}
    </span>
  )
}
