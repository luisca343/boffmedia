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
        "inline-flex items-center justify-center gap-3",
        "px-6 py-3 rounded-[var(--radius-lg)]",
        "border border-solid cursor-pointer whitespace-nowrap",
        "font-mono text-sm font-bold tracking-widest uppercase leading-none text-orange-500",
        "transition-[transform,box-shadow,background,border-color] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
        "focus-visible:outline-none",
        className,
      )}
      style={{
        background: isHovered
          ? "color-mix(in srgb, var(--orange-500) 12%, transparent)"
          : "transparent",
        borderColor: isHovered
          ? "color-mix(in srgb, var(--orange-500) 50%, transparent)"
          : "color-mix(in srgb, var(--orange-500) 20%, transparent)",
        boxShadow: isHovered
          ? "0 0 20px color-mix(in srgb, var(--orange-500) 25%, transparent)"
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
