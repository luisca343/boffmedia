import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * The 10px uppercase capsule that labels everything in Rooker — SHINY, VIVO, PRÓX,
 * CAPTURA. One shape, one type scale; the colour is passed in as literal classes by
 * the caller (never interpolated).
 */
export interface PillProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Pill({ children, className, title }: PillProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-rk-pill px-[0.4375rem] py-[2px]",
        "text-[0.625rem] font-extrabold uppercase leading-[1.5] tracking-[.04em]",
        className,
      )}
    >
      {children}
    </span>
  )
}
