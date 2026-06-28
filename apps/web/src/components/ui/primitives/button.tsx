import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Common base styles
  "roboto-medium inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-base transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-white",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary-active via-primary-active to-primary-hover hover:from-primary-soft hover:via-primary-active hover:to-primary active:from-primary-soft active:via-primary-soft active:to-primary-active focus-visible:ring-primary shadow-md hover:shadow-lg active:shadow-sm",
        outline: "border border-primary/70 bg-transparent hover:bg-primary-hover/10 hover:border-primary text-primary focus-visible:ring-primary shadow-sm hover:shadow-md active:shadow-sm",
        ghost: "hover:bg-primary-hover/10 text-primary-hover focus-visible:ring-primary hover:shadow-sm",
        link: "text-primary-hover underline-offset-4 hover:underline focus-visible:ring-primary hover:text-primary-hover",

        secondary: "bg-gradient-to-br from-secondary-active via-secondary-active to-secondary-hover hover:from-secondary-soft hover:via-secondary-active hover:to-secondary active:from-secondary-soft active:via-secondary-soft active:to-secondary-active  focus-visible:ring-secondary shadow-md hover:shadow-lg active:shadow-sm",
        secondaryOutline: "border border-secondary/70 bg-transparent hover:bg-secondary-hover/10 hover:border-secondary text-secondary-hover focus-visible:ring-secondary shadow-sm hover:shadow-md active:shadow-sm",
        secondaryGhost: "hover:bg-secondary-hover/10 text-secondary-hover focus-visible:ring-secondary hover:shadow-sm",
        secondaryLink: "text-secondary-hover underline-offset-4 hover:underline focus-visible:ring-secondary hover:text-secondary-hover",

        highlight: "bg-gradient-to-br from-warning via-warning to-warning-hover hover:from-warning-soft hover:via-warning hover:to-warning active:from-warning-soft active:via-warning-soft active:to-warning  focus-visible:ring-warning shadow-md hover:shadow-lg active:shadow-sm",
        highlightOutline: "border border-warning-border/70 bg-transparent hover:bg-warning-hover/10 hover:border-warning-border text-warning-hover focus-visible:ring-warning shadow-sm hover:shadow-md active:shadow-sm",
        highlightGhost: "hover:bg-warning-hover/10 text-warning-hover focus-visible:ring-warning hover:shadow-sm",
        highlightLink: "text-warning-hover underline-offset-4 hover:underline focus-visible:ring-warning hover:text-warning-hover",
        
        accent: "bg-gradient-to-br from-secondary-active via-secondary-active to-secondary-hover hover:from-secondary-soft hover:via-secondary-active hover:to-secondary active:from-secondary-soft active:via-secondary-soft active:to-secondary-active  shadow-md hover:shadow-lg active:shadow-sm focus-visible:ring-secondary",
        accentOutline: "border border-secondary/70 bg-transparent hover:bg-secondary/10 hover:border-secondary text-secondary-hover focus-visible:ring-secondary shadow-sm hover:shadow-md active:shadow-sm",
        accentGhost: "hover:bg-secondary-hover/10 text-secondary-hover focus-visible:ring-secondary hover:shadow-sm",
        accentLink: "text-secondary-hover underline-offset-4 hover:underline focus-visible:ring-secondary hover:text-secondary-hover",
        
        success: "bg-gradient-to-br from-success via-success to-success-hover hover:from-success-soft hover:via-success hover:to-success active:from-success-soft active:via-success-soft active:to-success   shadow-md focus-visible:ring-success hover:shadow-lg active:shadow-sm",
        successOutline: "border border-success-border/70 bg-transparent hover:bg-success/10 hover:border-success-border text-success focus-visible:ring-success shadow-sm hover:shadow-md active:shadow-sm",
        successGhost: "hover:bg-success/10 text-success focus-visible:ring-success hover:shadow-sm",
        successLink: "text-success underline-offset-4 hover:underline focus-visible:ring-success hover:text-success-hover",

        info: "bg-gradient-to-br from-info via-info to-info-hover hover:from-info-soft hover:via-info hover:to-info active:from-info-soft active:via-info-soft active:to-info   shadow-md focus-visible:ring-info hover:shadow-lg active:shadow-sm",
        infoOutline: "border border-info-border/70 bg-transparent hover:bg-info/10 hover:border-info-border text-info focus-visible:ring-info shadow-sm hover:shadow-md active:shadow-sm",
        infoGhost: "hover:bg-info/10 text-info focus-visible:ring-info hover:shadow-sm",
        infoLink: "text-info underline-offset-4 hover:underline focus-visible:ring-info hover:text-info-hover",

        warning: "bg-gradient-to-br from-warning via-warning to-warning hover:from-warning-soft hover:via-warning hover:to-warning active:from-warning-soft active:via-warning-soft active:to-warning   shadow-md focus-visible:ring-warning hover:shadow-lg active:shadow-sm",
        warningOutline: "border border-warning-border/70 bg-transparent hover:bg-warning/10 hover:border-warning-border text-warning focus-visible:ring-warning shadow-sm hover:shadow-md active:shadow-sm",
        warningGhost: "hover:bg-warning/10 text-warning focus-visible:ring-warning hover:shadow-sm",
        warningLink: "text-warning underline-offset-4 hover:underline focus-visible:ring-warning hover:text-warning-hover",

        error: "bg-gradient-to-br from-danger via-danger to-danger-hover hover:from-danger-soft hover:via-danger hover:to-danger active:from-danger-soft active:via-danger-soft active:to-danger   shadow-md focus-visible:ring-danger hover:shadow-lg active:shadow-sm",
        errorOutline: "border border-danger-border/70 bg-transparent hover:bg-danger/10 hover:border-danger-border text-danger focus-visible:ring-danger shadow-sm hover:shadow-md active:shadow-sm",
        errorGhost: "hover:bg-danger/10 text-danger focus-visible:ring-danger hover:shadow-sm",
        errorLink: "text-danger underline-offset-4 hover:underline focus-visible:ring-danger hover:text-danger-hover",

        wingull: "bg-secondary text-secondary-active hover:bg-secondary-hover focus-visible:ring-secondary shadow-md hover:shadow-lg active:shadow-sm",
        wingullDestructive: "bg-gradient-to-br from-red-700 via-red-600 to-red-500 hover:from-red-800 hover:via-red-700 hover:to-red-600 active:from-red-900 active:via-red-800 active:to-red-700 !text-secondary-hover focus-visible:ring-red-600 shadow-md hover:shadow-lg active:shadow-sm",
        wingullOutline: "border border-secondary/70 bg-transparent hover:bg-secondary-hover/10 hover:border-secondary text-secondary-hover focus-visible:ring-secondary shadow-sm hover:shadow-md active:shadow-sm",
        wingullSecondary: "bg-secondary-soft text-secondary-hover hover:bg-secondary-active focus-visible:ring-secondary shadow-md hover:shadow-lg active:shadow-sm",
        wingullGhost: "hover:bg-secondary-hover/10 text-secondary-hover focus-visible:ring-secondary hover:shadow-sm",
        wingullLink: "text-secondary-hover underline-offset-4 hover:underline focus-visible:ring-secondary hover:text-secondary-hover",
      },
      enhanced: {
        false: "",
        true: "!text-white button-shine button-glow ripple transition-all duration-300 ease-in-out hover:scale-[1.02] transform-gpu relative overflow-hidden border-primary/30 backdrop-blur-sm text-glow shadow-lg hover:shadow-xl active:shadow-md",
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