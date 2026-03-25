"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type LabelVariant = "default" | "wingull"

interface LabelProps extends 
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  VariantProps<typeof labelVariants> {
  variant?: LabelVariant;
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "text-surface-300",
    wingull: "text-secondary-100",
  }

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), variantStyles[variant], className)}
      {...props}
    />
  )
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
export type { LabelVariant }