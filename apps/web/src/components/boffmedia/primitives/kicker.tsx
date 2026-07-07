import * as React from "react"
import { cn } from "@/lib/utils"

export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-[12px]/none font-semibold uppercase tracking-[0.16em] text-accent",
        "before:h-0.5 before:w-[22px] before:flex-none before:bg-accent before:content-['']",
        className,
      )}
    >
      {children}
    </span>
  )
}
