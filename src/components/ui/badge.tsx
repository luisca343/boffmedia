import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type BadgeTheme = "default" | "wingull"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-300 text-surface-900",
        secondary:
          "border-transparent bg-surface-800 text-primary-300",
        destructive:
          "border-transparent bg-red-500 text-surface-100",
        outline: "text-primary-300 border border-primary-300",
        success: 
          "border-transparent bg-highlight-500 text-surface-100",
        warning:
          "border-transparent bg-yellow-500 text-surface-900",
      },
      theme: {
        default: "focus:ring-primary-300 focus:ring-offset-surface-900",
        wingull: "focus:ring-secondary-300 focus:ring-offset-secondary-950",
      }
    },
    compoundVariants: [
      {
        variant: "default",
        theme: "wingull",
        class: "bg-secondary-300 text-secondary-950",
      },
      {
        variant: "secondary",
        theme: "wingull",
        class: "bg-secondary-800 text-secondary-300",
      },
      {
        variant: "outline",
        theme: "wingull",
        class: "text-secondary-300 border-secondary-300",
      },
      {
        variant: "destructive",
        theme: "wingull",
        class: "bg-red-400 text-secondary-950",
      },
      {
        variant: "success",
        theme: "wingull",
        class: "bg-highlight-400 text-secondary-950",
      },
      {
        variant: "warning",
        theme: "wingull",
        class: "bg-yellow-400 text-secondary-950",
      },
    ],
    defaultVariants: {
      variant: "default",
      theme: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, theme, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, theme }), className)} {...props} />
  )
}

export { Badge }