"use client"

import { cn } from "@/lib/utils"

const SIZES = { sm: 16, md: 28, lg: 44 } as const

interface BoffSpinnerProps {
  size?: keyof typeof SIZES
  label?: string
  className?: string
}

export function BoffSpinner({ size = "md", label, className }: BoffSpinnerProps) {
  const px = SIZES[size]
  return (
    <span role="status" className={cn("inline-flex flex-col items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="rounded-full animate-spin"
        style={{
          width: px,
          height: px,
          border: "2px solid var(--border)",
          borderTopColor: "var(--secondary-hover)",
        }}
      />
      {label ? (
        <span className="text-t-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      ) : (
        <span className="sr-only">Cargando…</span>
      )}
    </span>
  )
}
