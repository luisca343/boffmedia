import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type BadgeTheme = "default" | "wingull"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm",
        secondary:
          "border border-primary-500/20 bg-primary-500/10 text-primary-300",
        destructive:
          "border-transparent bg-gradient-to-r from-error-700 to-error-500 text-white shadow-sm",
        outline: "text-primary-300 border border-primary-400/50 bg-primary-400/5",
        success:
          "border-transparent bg-gradient-to-r from-success-700 to-success-500 text-white shadow-sm",
        warning:
          "border-transparent bg-gradient-to-r from-warning-700 to-warning-500 text-white shadow-sm",
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
        class: "from-secondary-600 to-secondary-500 text-white",
      },
      {
        variant: "secondary",
        theme: "wingull",
        class: "border-secondary-500/20 bg-secondary-500/10 text-secondary-300",
      },
      {
        variant: "outline",
        theme: "wingull",
        class: "text-secondary-300 border-secondary-400/50 bg-secondary-400/5",
      },
      {
        variant: "destructive",
        theme: "wingull",
        class: "from-red-700 to-red-500",
      },
      {
        variant: "success",
        theme: "wingull",
        class: "from-highlight-700 to-highlight-500",
      },
      {
        variant: "warning",
        theme: "wingull",
        class: "from-yellow-700 to-yellow-500",
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
