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
        "inline-grid place-items-center min-w-[1.625rem] pt-[0.3125rem] px-[0.4375rem] pb-[0.375rem]",
        "font-mono text-[0.75rem] font-semibold leading-none text-txt",
        "bg-panel-2 border border-solid border-line-2 border-b-[3px]",
        className,
      )}
    >
      {children}
    </kbd>
  )
}
