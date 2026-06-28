"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BoffInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const BoffInput = React.forwardRef<HTMLInputElement, BoffInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "w-full font-body text-sm text-ink",
          "bg-layer-2 border border-solid border-edge-strong",
          "rounded-[var(--btn-radius,9999px)]",
          "py-2.5 px-3.5",
          "transition-[border-color,box-shadow] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
          "placeholder:text-ink-dim",
          "focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)]",
          "disabled:opacity-55 disabled:cursor-not-allowed",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
BoffInput.displayName = "BoffInput"
