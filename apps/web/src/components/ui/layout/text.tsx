import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    color: {
      default: "text-surface-200",
      primary: "text-primary-400",
      secondary: "text-secondary-400",
      muted: "text-surface-400",
      disabled: "text-surface-600",
      inherit: "text-inherit",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    leading: {
      tight: "leading-tight",
      snug: "leading-snug",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    },
  },
  defaultVariants: {
    size: "md",
    color: "default",
    weight: "normal",
    leading: "normal",
  },
})

type TextTag = "p" | "span" | "li" | "label" | "small" | "strong" | "em" | "div"

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: TextTag
  truncate?: boolean
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as: Comp = "p", size, color, weight, leading, truncate, className, ...props }, ref) => {
    return (
      <Comp
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn(textVariants({ size, color, weight, leading }), truncate && "truncate", className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }
