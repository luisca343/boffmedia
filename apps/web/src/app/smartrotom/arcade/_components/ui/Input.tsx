"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type ArInputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, ArInputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-white/10 bg-black/45 px-3.5 py-2.5",
        "font-ar-mono text-[13px] text-ar-ink placeholder:text-ar-ink-muted",
        "focus:border-ar-cyan/50 focus:bg-black/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  )
})
