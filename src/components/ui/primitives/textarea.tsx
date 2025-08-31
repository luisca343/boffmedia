import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-surface-700 bg-surface-800 text-primary-400 ring-offset-surface-900 placeholder:text-surface-400 focus-visible:ring-primary-300",
        wingull: "border-secondary-700 bg-secondary-900 text-secondary-300 ring-offset-secondary-950 placeholder:text-secondary-500 focus-visible:ring-secondary-300",
      },
      size: {
        default: "px-3 py-2",
        sm: "text-xs px-2 py-1",
        lg: "text-base px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, variant, size, ...props }, ref) => {
  return <textarea className={cn(textareaVariants({ variant, size, className }))} ref={ref} {...props} />
})
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }