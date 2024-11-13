import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all",
  {
    variants: {
      variant: {
        default: 'bg-primary-500 border-2 border-black shadow-light hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
        furret: 'bg-pink-400 border-2 border-black shadow-light hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
        noShadow: 'bg-primary-500 border-2 border-black',
        link: 'underline-offset-4 text-black hover:underline',
        neutral:
          'bg-white border-2 border-black shadow-light hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none dark:hover:shadow-none',
        reverse:
          'bg-primary-500 border-2 border-black hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY hover:shadow-light',
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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

const SmartRotomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
SmartRotomButton.displayName = 'SmartRotomButton'

export { SmartRotomButton, buttonVariants }