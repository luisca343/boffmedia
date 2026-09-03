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
    default: "border-edge ring-offset-layer-1 focus-visible:ring-primary hover:border-primary/70 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white data-[state=checked]:[box-shadow:0_0_8px_0px_rgb(var(--primary-500)/0.45)]",
    wingull: "border-secondary ring-offset-secondary-soft focus-visible:ring-secondary data-[state=checked]:bg-secondary-hover data-[state=checked]:border-secondary data-[state=checked]:text-white",
  }

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-[1.125rem] w-[1.125rem] shrink-0 rounded border-2 ring-offset-2 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
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
