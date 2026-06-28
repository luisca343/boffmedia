"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  ticks?: boolean
}

export function BoffCard({ className, hover, ticks, children, style, ...props }: BoffCardProps) {
  return (
    <div
      className={cn(
        "boff-card",
        "relative",
        "transition-[transform,box-shadow,border-color] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
        hover && "boff-card--hover",
        ticks && cn(
          "data-[direction=hud]:before:absolute data-[direction=hud]:before:w-2.5 data-[direction=hud]:before:h-2.5",
          "data-[direction=hud]:before:border-2 data-[direction=hud]:before:border-orange-500",
          "data-[direction=hud]:before:border-r-0 data-[direction=hud]:before:border-b-0",
          "data-[direction=hud]:before:top-1.5 data-[direction=hud]:before:left-1.5 data-[direction=hud]:before:pointer-events-none",
          "data-[direction=hud]:after:absolute data-[direction=hud]:after:w-2.5 data-[direction=hud]:after:h-2.5",
          "data-[direction=hud]:after:border-2 data-[direction=hud]:after:border-orange-500",
          "data-[direction=hud]:after:border-l-0 data-[direction=hud]:after:border-t-0",
          "data-[direction=hud]:after:bottom-1.5 data-[direction=hud]:after:right-1.5 data-[direction=hud]:after:pointer-events-none",
        ),
        className,
      )}
      style={{
        background: "var(--card-bg)",
        border: "var(--card-border)",
        borderRadius: "var(--radius-lg, 22px)",
        boxShadow: "var(--card-shadow)",
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {children}
    </div>
  )
}
