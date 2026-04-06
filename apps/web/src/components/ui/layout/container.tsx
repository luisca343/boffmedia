import * as React from "react"
import { cn } from "@/lib/utils"

const SIZE_MAP = {
  xs: "max-w-2xl",
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-screen-2xl",
  full: "",
} as const

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  size?: keyof typeof SIZE_MAP
  padded?: boolean
  centered?: boolean
  as?: React.ElementType
}

const Container = React.forwardRef<HTMLElement, ContainerProps>(
  (
    {
      size = "lg",
      padded = true,
      centered = true,
      as: Comp = "div",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Comp
        ref={ref}
        className={cn(
          SIZE_MAP[size],
          centered && "mx-auto",
          padded && "px-4 sm:px-6",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Container.displayName = "Container"

export { Container }
