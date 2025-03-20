"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type ProgressVariant = "default" | "wingull"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: ProgressVariant;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: {
      root: "bg-primary-100 dark:bg-primary-800",
      indicator: "bg-primary-900 dark:bg-primary-50"
    },
    wingull: {
      root: "bg-blue-200 dark:bg-blue-800",
      indicator: "bg-blue-600"
    }
  }
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full",
        variantStyles[variant].root,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", variantStyles[variant].indicator)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
export type { ProgressVariant }