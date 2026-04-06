import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("", {
  variants: {
    size: {
      "2xl": "text-5xl sm:text-6xl lg:text-7xl",
      xl: "text-4xl sm:text-5xl lg:text-6xl",
      lg: "text-3xl sm:text-4xl lg:text-5xl",
      md: "text-2xl sm:text-3xl",
      sm: "text-xl sm:text-2xl",
      xs: "text-lg sm:text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
      black: "font-black",
    },
    color: {
      default: "text-surface-50",
      primary: "text-primary-400",
      secondary: "text-secondary-400",
      accent: "text-accent-400",
      muted: "text-surface-300",
      inherit: "text-inherit",
    },
  },
  defaultVariants: {
    size: "md",
    weight: "semibold",
    color: "default",
  },
})

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as: HeadingTag
  /** Apply Orbitron font family — common in boffmedia cyberpunk sections */
  orbitron?: boolean
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Comp, size, weight, color, orbitron = false, className, style, ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn(headingVariants({ size, weight, color }), "leading-tight tracking-tight", className)}
        style={orbitron ? { fontFamily: "Orbitron, sans-serif", ...style } : style}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants }
