import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "roboto-medium inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-surface-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-surface-950 hover:bg-primary-400 focus-visible:ring-primary-400" ,
        destructive: "bg-red-600 text-surface-50 hover:bg-red-600/90 focus-visible:ring-red-600",
        outline: "border border-primary-400 bg-transparent hover:bg-primary-400/10 text-primary-400 focus-visible:ring-primary-400",
        secondary: "bg-surface-700 text-primary-400 hover:bg-surface-600 focus-visible:ring-primary-400",
        ghost: "hover:bg-primary-400/10 text-primary-400 focus-visible:ring-primary-400",
        link: "text-primary-400 underline-offset-4 hover:underline focus-visible:ring-primary-400",

        // Wingull variants
        wingull: "bg-blue-500 text-blue-950 hover:bg-blue-400 focus-visible:ring-blue-400",
        wingullDestructive: "bg-red-600 text-blue-50 hover:bg-red-600/90 focus-visible:ring-red-600",
        wingullOutline: "border border-blue-400 bg-transparent hover:bg-blue-400/10 text-blue-400 focus-visible:ring-blue-400",
        wingullSecondary: "bg-blue-800 text-blue-400 hover:bg-blue-700 focus-visible:ring-blue-400",
        wingullGhost: "hover:bg-blue-400/10 text-blue-400 focus-visible:ring-blue-400",
        wingullLink: "text-blue-400 underline-offset-4 hover:underline focus-visible:ring-blue-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-20 rounded-lg px-16",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }