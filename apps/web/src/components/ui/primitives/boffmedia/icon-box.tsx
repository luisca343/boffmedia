"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface IconBoxProps {
  icon?: string
  name?: string
  size?: "sm" | "md" | "lg"
  tone?: "orange" | "accent" | "muted"
  children?: React.ReactNode
  className?: string
}

export function IconBox({ icon, name, size = "md", tone = "orange", children, className }: IconBoxProps) {
  const iconSizes = { sm: 16, md: 20, lg: 26 }
  return (
    <span className={cn("iconbox", `iconbox--${size}`, `iconbox--${tone}`, className)}>
      {children || <Icon name={icon || name!} size={iconSizes[size]} />}
    </span>
  )
}
