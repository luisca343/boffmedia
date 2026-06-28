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
      root: "focus-visible:ring-primary focus-visible:ring-offset-layer-1 data-[state=checked]:bg-primary data-[state=unchecked]:bg-layer-3 data-[state=checked]:[box-shadow:0_0_12px_-2px_rgb(var(--primary-500)/0.55)]",
      thumb: "bg-white shadow-md"
    },
    wingull: {
      root: "focus-visible:ring-secondary focus-visible:ring-offset-secondary-soft data-[state=checked]:bg-secondary-hover data-[state=unchecked]:bg-secondary-active",
      thumb: "bg-white shadow-md"
    }
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant].root,
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          variantStyles[variant].thumb
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
export type { SwitchVariant }
