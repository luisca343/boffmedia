"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

type SwitchVariant = "default" | "wingull"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  variant?: SwitchVariant;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: {
      root: "focus-visible:ring-primary-300 focus-visible:ring-offset-surface-900 data-[state=checked]:bg-primary-300 data-[state=unchecked]:bg-surface-700",
      thumb: "bg-surface-800"
    },
    wingull: {
      root: "focus-visible:ring-secondary-300 focus-visible:ring-offset-secondary-950 data-[state=checked]:bg-secondary-300 data-[state=unchecked]:bg-secondary-700",
      thumb: "bg-secondary-950"
    }
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant].root,
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          variantStyles[variant].thumb
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
export type { SwitchVariant }