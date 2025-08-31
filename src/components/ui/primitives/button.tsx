import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Common base styles
  "roboto-medium inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-surface-950 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-white",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary-700 via-primary-600 to-primary-400 hover:from-primary-800 hover:via-primary-700 hover:to-primary-500 active:from-primary-900 active:via-primary-800 active:to-primary-700 focus-visible:ring-primary-400 shadow-md hover:shadow-lg active:shadow-sm",
        outline: "border border-primary-500/70 bg-transparent hover:bg-primary-400/10 hover:border-primary-500 text-primary-500 focus-visible:ring-primary-500 shadow-sm hover:shadow-md active:shadow-sm",
        ghost: "hover:bg-primary-400/10 text-primary-400 focus-visible:ring-primary-400 hover:shadow-sm",
        link: "text-primary-400 underline-offset-4 hover:underline focus-visible:ring-primary-400 hover:text-primary-300",

        secondary: "bg-gradient-to-br from-secondary-700 via-secondary-600 to-secondary-400 hover:from-secondary-800 hover:via-secondary-700 hover:to-secondary-500 active:from-secondary-900 active:via-secondary-800 active:to-secondary-700  focus-visible:ring-secondary-400 shadow-md hover:shadow-lg active:shadow-sm",
        secondaryOutline: "border border-secondary-500/70 bg-transparent hover:bg-secondary-400/10 hover:border-secondary-500 text-secondary-400 focus-visible:ring-secondary-400 shadow-sm hover:shadow-md active:shadow-sm",
        secondaryGhost: "hover:bg-secondary-400/10 text-secondary-400 focus-visible:ring-secondary-400 hover:shadow-sm",
        secondaryLink: "text-secondary-400 underline-offset-4 hover:underline focus-visible:ring-secondary-400 hover:text-secondary-300",

        highlight: "bg-gradient-to-br from-highlight-700 via-highlight-600 to-highlight-400 hover:from-highlight-800 hover:via-highlight-700 hover:to-highlight-500 active:from-highlight-900 active:via-highlight-800 active:to-highlight-700  focus-visible:ring-highlight-400 shadow-md hover:shadow-lg active:shadow-sm",
        highlightOutline: "border border-highlight-500/70 bg-transparent hover:bg-highlight-400/10 hover:border-highlight-500 text-highlight-400 focus-visible:ring-highlight-400 shadow-sm hover:shadow-md active:shadow-sm",
        highlightGhost: "hover:bg-highlight-400/10 text-highlight-400 focus-visible:ring-highlight-400 hover:shadow-sm",
        highlightLink: "text-highlight-400 underline-offset-4 hover:underline focus-visible:ring-highlight-400 hover:text-highlight-300",
        
        accent: "bg-gradient-to-br from-accent-700 via-accent-600 to-accent-400 hover:from-accent-800 hover:via-accent-700 hover:to-accent-500 active:from-accent-900 active:via-accent-800 active:to-accent-700  shadow-md hover:shadow-lg active:shadow-sm focus-visible:ring-accent-400",
        accentOutline: "border border-accent-500/70 bg-transparent hover:bg-accent-500/10 hover:border-accent-500 text-accent-400 focus-visible:ring-accent-400 shadow-sm hover:shadow-md active:shadow-sm",
        accentGhost: "hover:bg-accent-400/10 text-accent-400 focus-visible:ring-accent-400 hover:shadow-sm",
        accentLink: "text-accent-400 underline-offset-4 hover:underline focus-visible:ring-accent-400 hover:text-accent-300",
        
        success: "bg-gradient-to-br from-success-700 via-success-600 to-success-400 hover:from-success-800 hover:via-success-700 hover:to-success-500 active:from-success-900 active:via-success-800 active:to-success-700   shadow-md focus-visible:ring-success-500 hover:shadow-lg active:shadow-sm",
        successOutline: "border border-success-500/70 bg-transparent hover:bg-success-500/10 hover:border-success-500 text-success-500 focus-visible:ring-success-500 shadow-sm hover:shadow-md active:shadow-sm",
        successGhost: "hover:bg-success-500/10 text-success-500 focus-visible:ring-success-500 hover:shadow-sm",
        successLink: "text-success-500 underline-offset-4 hover:underline focus-visible:ring-success-500 hover:text-success-400",

        info: "bg-gradient-to-br from-info-700 via-info-600 to-info-400 hover:from-info-800 hover:via-info-700 hover:to-info-500 active:from-info-900 active:via-info-800 active:to-info-700   shadow-md focus-visible:ring-info-500 hover:shadow-lg active:shadow-sm",
        infoOutline: "border border-info-500/70 bg-transparent hover:bg-info-500/10 hover:border-info-500 text-info-500 focus-visible:ring-info-500 shadow-sm hover:shadow-md active:shadow-sm",
        infoGhost: "hover:bg-info-500/10 text-info-500 focus-visible:ring-info-500 hover:shadow-sm",
        infoLink: "text-info-500 underline-offset-4 hover:underline focus-visible:ring-info-500 hover:text-info-400",

        warning: "bg-gradient-to-br from-warning-700 via-warning-600 to-warning-500 hover:from-warning-800 hover:via-warning-700 hover:to-warning-600 active:from-warning-900 active:via-warning-800 active:to-warning-700   shadow-md focus-visible:ring-warning-500 hover:shadow-lg active:shadow-sm",
        warningOutline: "border border-warning-500/70 bg-transparent hover:bg-warning-500/10 hover:border-warning-500 text-warning-500 focus-visible:ring-warning-500 shadow-sm hover:shadow-md active:shadow-sm",
        warningGhost: "hover:bg-warning-500/10 text-warning-500 focus-visible:ring-warning-500 hover:shadow-sm",
        warningLink: "text-warning-500 underline-offset-4 hover:underline focus-visible:ring-warning-500 hover:text-warning-400",

        error: "bg-gradient-to-br from-error-700 via-error-600 to-error-400 hover:from-error-800 hover:via-error-700 hover:to-error-500 active:from-error-900 active:via-error-800 active:to-error-700   shadow-md focus-visible:ring-error-500 hover:shadow-lg active:shadow-sm",
        errorOutline: "border border-error-500/70 bg-transparent hover:bg-error-500/10 hover:border-error-500 text-error-500 focus-visible:ring-error-500 shadow-sm hover:shadow-md active:shadow-sm",
        errorGhost: "hover:bg-error-500/10 text-error-500 focus-visible:ring-error-500 hover:shadow-sm",
        errorLink: "text-error-500 underline-offset-4 hover:underline focus-visible:ring-error-500 hover:text-error-400",

        wingull: "bg-secondary-500 text-secondary-950 hover:bg-secondary-400 focus-visible:ring-secondary-400 shadow-md hover:shadow-lg active:shadow-sm",
        wingullDestructive: "bg-gradient-to-br from-red-700 via-red-600 to-red-500 hover:from-red-800 hover:via-red-700 hover:to-red-600 active:from-red-900 active:via-red-800 active:to-red-700 !text-secondary-50 focus-visible:ring-red-600 shadow-md hover:shadow-lg active:shadow-sm",
        wingullOutline: "border border-secondary-500/70 bg-transparent hover:bg-secondary-400/10 hover:border-secondary-500 text-secondary-400 focus-visible:ring-secondary-400 shadow-sm hover:shadow-md active:shadow-sm",
        wingullSecondary: "bg-secondary-800 text-secondary-400 hover:bg-secondary-700 focus-visible:ring-secondary-400 shadow-md hover:shadow-lg active:shadow-sm",
        wingullGhost: "hover:bg-secondary-400/10 text-secondary-400 focus-visible:ring-secondary-400 hover:shadow-sm",
        wingullLink: "text-secondary-400 underline-offset-4 hover:underline focus-visible:ring-secondary-400 hover:text-secondary-300",
      },
      enhanced: {
        false: "",
        true: "!text-white button-shine button-glow ripple transition-all duration-300 ease-in-out hover:scale-[1.02] transform-gpu relative overflow-hidden border-primary-500/30 backdrop-blur-sm text-glow shadow-lg hover:shadow-xl active:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-16 rounded-lg px-16 text-lg",
        icon: "h-10 w-10",
        zero: "py-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      enhanced: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  enhanced?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, enhanced, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, enhanced, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }