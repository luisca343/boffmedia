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
          "border-transparent bg-gradient-to-r from-primary-active to-primary text-white shadow-sm",
        secondary:
          "border border-primary/20 bg-primary/10 text-primary-hover",
        destructive:
          "border-transparent bg-gradient-to-r from-danger to-danger text-white shadow-sm",
        outline: "text-primary-hover border border-primary/50 bg-primary-hover/5",
        success:
          "border-transparent bg-gradient-to-r from-success to-success text-white shadow-sm",
        warning:
          "border-transparent bg-gradient-to-r from-warning to-warning text-white shadow-sm",
      },
      theme: {
        default: "focus:ring-primary focus:ring-offset-layer-1",
        wingull: "focus:ring-secondary focus:ring-offset-secondary-soft",
      }
    },
    compoundVariants: [
      {
        variant: "default",
        theme: "wingull",
        class: "from-secondary-active to-secondary text-white",
      },
      {
        variant: "secondary",
        theme: "wingull",
        class: "border-secondary/20 bg-secondary/10 text-secondary-hover",
      },
      {
        variant: "outline",
        theme: "wingull",
        class: "text-secondary-hover border-secondary/50 bg-secondary-hover/5",
      },
      {
        variant: "destructive",
        theme: "wingull",
        class: "from-red-700 to-red-500",
      },
      {
        variant: "success",
        theme: "wingull",
        class: "from-warning to-warning",
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
