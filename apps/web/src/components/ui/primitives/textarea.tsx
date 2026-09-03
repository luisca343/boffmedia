import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[5rem] w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-edge bg-layer-2 text-primary-hover ring-offset-layer-1 placeholder:text-ink-muted focus-visible:ring-primary",
        wingull: "border-secondary-active bg-secondary-soft text-secondary-hover ring-offset-secondary-soft placeholder:text-secondary focus-visible:ring-secondary",
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