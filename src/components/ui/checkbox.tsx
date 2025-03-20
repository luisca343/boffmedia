"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from 'lucide-react'

import { cn } from "@/lib/utils"

type CheckboxVariant = "default" | "wingull"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  variant?: CheckboxVariant;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "border-primary-400 ring-offset-surface-900 focus-visible:ring-primary-400 data-[state=checked]:bg-primary-400 data-[state=checked]:text-surface-900",
    wingull: "border-blue-300 ring-offset-blue-900 focus-visible:ring-blue-300 data-[state=checked]:bg-blue-300 data-[state=checked]:text-blue-900",
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-2 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
export type { CheckboxVariant }