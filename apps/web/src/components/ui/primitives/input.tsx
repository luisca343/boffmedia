import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-edge/80 bg-layer-2/80 text-ink ring-offset-base placeholder:text-ink-muted hover:border-edge/80 focus-visible:ring-primary/50 focus-visible:border-primary/60",
        dark: "border-edge bg-layer-2 text-primary-hover ring-offset-base placeholder:text-ink-muted focus-visible:ring-primary hover:border-edge",
        neutral: "border-neutral-700 bg-neutral-800 text-neutral-100 ring-offset-neutral-950 placeholder:text-neutral-500 focus-visible:ring-primary hover:border-neutral-600",
        wingull: "border-secondary bg-secondary-soft text-secondary ring-offset-white focus-visible:ring-secondary placeholder:text-secondary-hover hover:bg-secondary-soft/30 focus:border-secondary",
        boff: "border-edge/60 bg-layer-2 text-ink ring-offset-layer-1 placeholder:text-ink-muted hover:border-secondary/50 hover:bg-layer-3 focus-visible:ring-secondary/30 focus-visible:border-secondary/60 transition-all duration-200",
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
