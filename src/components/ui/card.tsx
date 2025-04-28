"use client"
import * as React from "react"

import { cn } from "@/lib/utils"

type CardVariant = "default" | "wingull"

const CardVariantContext = React.createContext<CardVariant>("default")

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "border-surface-700 bg-surface-800 text-surface-100",
      wingull: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900",
    }

    return (
      <CardVariantContext.Provider value={variant}>
        <div
          ref={ref}
          className={cn(
            "rounded-lg border shadow-md",
            variantStyles[variant],
            className
          )}
          {...props}
        />
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
    default: "text-primary-400",
    wingull: "text-blue-700",
  }

  return (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
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
    default: "text-surface-300",
    wingull: "text-blue-600",
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