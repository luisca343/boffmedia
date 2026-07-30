import * as React from "react"
import { cn } from "../cn"

export interface KbdProps {
  children: React.ReactNode
  className?: string
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-grid place-items-center min-w-[26px] pt-[5px] px-[7px] pb-[6px]",
        "font-mono text-[12px] font-semibold leading-none text-txt",
        "bg-panel-2 border border-solid border-line-2 border-b-[3px]",
        className,
      )}
    >
      {children}
    </kbd>
  )
}
