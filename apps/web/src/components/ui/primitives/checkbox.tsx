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
    default: "border-surface-500 ring-offset-surface-900 focus-visible:ring-primary-400 hover:border-primary-400/70 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500 data-[state=checked]:text-white data-[state=checked]:[box-shadow:0_0_8px_0px_rgb(var(--primary-500)/0.45)]",
    wingull: "border-secondary-300 ring-offset-secondary-900 focus-visible:ring-secondary-300 data-[state=checked]:bg-secondary-400 data-[state=checked]:border-secondary-400 data-[state=checked]:text-white",
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-[18px] w-[18px] shrink-0 rounded border-2 ring-offset-2 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
export type { CheckboxVariant }
