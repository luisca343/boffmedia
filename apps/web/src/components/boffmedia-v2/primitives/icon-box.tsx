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

const sizes = { sm: "w-[34px] h-[34px]", md: "w-[46px] h-[46px]", lg: "w-[60px] h-[60px] rounded-[var(--radius-lg,22px)]" }
const tones = {
  orange: cn(
    "text-orange-500 bg-[color-mix(in_srgb,var(--orange-500)_13%,transparent)]",
    "border border-solid border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)]",
    "data-[direction=neon]:shadow-[0_0_24px_-10px_var(--orange-500)]",
  ),
  accent: cn(
    "text-secondary-hover bg-secondary-soft",
    "border border-solid border-[color-mix(in_srgb,var(--secondary)_30%,transparent)]",
  ),
  muted: cn(
    "text-ink-dim bg-layer-3",
    "border border-solid border-edge-strong",
  ),
}

export function IconBox({ icon, name, size = "md", tone = "orange", children, className }: IconBoxProps) {
  const iconSizes = { sm: 16, md: 20, lg: 26 }
  return (
    <span className={cn("grid place-items-center rounded-[var(--radius,14px)] shrink-0", sizes[size], tones[tone], className)}>
      {children || <Icon name={icon || name!} size={iconSizes[size]} />}
    </span>
  )
}
