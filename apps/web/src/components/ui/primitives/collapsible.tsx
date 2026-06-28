"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

import { cn } from "@/lib/utils"

type CollapsibleVariant = "default" | "wingull"

const CollapsibleVariantContext = React.createContext<CollapsibleVariant>("default")

interface CollapsibleProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> {
  variant?: CollapsibleVariant;
}

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>(({ variant = "default", ...props }, ref) => {
  return (
    <CollapsibleVariantContext.Provider value={variant}>
      <CollapsiblePrimitive.Root ref={ref} {...props} />
    </CollapsibleVariantContext.Provider>
  )
})
Collapsible.displayName = "Collapsible"

const useCollapsibleVariant = () => React.useContext(CollapsibleVariantContext)

interface CollapsibleTriggerProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> {}

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(({ className, ...props }, ref) => {
  const variant = useCollapsibleVariant()
  
  const variantStyles = {
    default: "text-primary-hover hover:text-primary-hover",
    wingull: "text-secondary-hover hover:text-secondary-hover"
  }
  
  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  )
})
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName

interface CollapsibleContentProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> {}

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(({ className, ...props }, ref) => {
  const variant = useCollapsibleVariant()
  
  const variantStyles = {
    default: "text-ink",
    wingull: "text-secondary-hover"
  }
  
  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className={cn(
        "data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
export type { CollapsibleVariant }