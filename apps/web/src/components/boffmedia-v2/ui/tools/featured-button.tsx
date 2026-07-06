"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "../../primitives/icon"

interface FeaturedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isHovered?: boolean
}

export function FeaturedButton({
  isHovered = false,
  children,
  className,
  ...props
}: FeaturedButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 px-6 py-3 rounded-lg border font-display text-sm font-bold tracking-widest uppercase transition-all duration-300",
        "cursor-pointer whitespace-nowrap leading-none text-orange-500",
        "focus-visible:outline-none",
        className,
      )}
      style={{
        borderColor: isHovered
          ? "color-mix(in srgb, var(--orange-500) 35%, transparent)"
          : "color-mix(in srgb, var(--orange-500) 20%, transparent)",
        background: isHovered
          ? "color-mix(in srgb, var(--orange-500) 12%, transparent)"
          : "transparent",
        boxShadow: isHovered
          ? "0 0 20px color-mix(in srgb, var(--orange-500) 30%, transparent)"
          : "none",
        transform: isHovered ? "translateX(3px)" : "translateX(0)",
      }}
      {...props}
    >
      {children}
      <Icon name="arrow" size={16} />
    </button>
  )
}
