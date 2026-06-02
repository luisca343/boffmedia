"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BoffInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const BoffInput = React.forwardRef<HTMLInputElement, BoffInputProps>(
  ({ className, ...props }, ref) => {
    return <input className={cn("input", className)} ref={ref} {...props} />
  }
)
BoffInput.displayName = "BoffInput"
