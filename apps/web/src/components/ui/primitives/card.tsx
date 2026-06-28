"use client"
import * as React from "react"

import { cn } from "@/lib/utils"

type CardVariant = "default" | "wingull"

const CardVariantContext = React.createContext<CardVariant>("default")

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default: "border-edge bg-layer-2 text-ink",
      wingull: "border-secondary bg-gradient-to-br from-secondary-soft to-secondary-soft text-secondary-active",
    }

    const accentLineStyles = {
      default: "bg-gradient-to-r from-transparent via-primary/40 to-transparent",
      wingull: "bg-gradient-to-r from-transparent via-secondary-hover/50 to-transparent",
    }

    return (
      <CardVariantContext.Provider value={variant}>
        <div
          ref={ref}
          className={cn(
            "rounded-xl border shadow-md relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-edge/70",
            variantStyles[variant],
            className
          )}
          {...props}
        >
          <div className={cn("absolute inset-x-0 top-0 h-px", accentLineStyles[variant])} />
          {children}
        </div>
      </CardVariantContext.Provider>
    )
  }
)
Card.displayName = "Card"

const useCardVariant = () => React.useContext(CardVariantContext)

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const variant = useCardVariant()

  const variantStyles = {
    default: "text-primary-hover",
    wingull: "text-secondary-active",
  }

  return (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-bold leading-none tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const variant = useCardVariant()

  const variantStyles = {
    default: "text-ink-muted",
    wingull: "text-secondary-active",
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm", variantStyles[variant], className)}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export type { CardVariant }
