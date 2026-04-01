import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-surface-600/80 bg-surface-800/80 text-surface-100 ring-offset-surface-950 placeholder:text-surface-500 hover:border-surface-500/80 focus-visible:ring-primary-500/50 focus-visible:border-primary-500/60",
        dark: "border-surface-700 bg-surface-800 text-primary-400 ring-offset-surface-950 placeholder:text-surface-500 focus-visible:ring-primary-400 hover:border-surface-600",
        neutral: "border-neutral-700 bg-neutral-800 text-neutral-100 ring-offset-neutral-950 placeholder:text-neutral-500 focus-visible:ring-primary-300 hover:border-neutral-600",
        wingull: "border-secondary-200 bg-secondary-50 text-secondary-500 ring-offset-white focus-visible:ring-secondary-400 placeholder:text-secondary-300 hover:bg-secondary-100/30 focus:border-secondary-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant, ...props }, ref) => {
  return <input type={type} className={cn(inputVariants({ variant, className }))} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input, inputVariants }
