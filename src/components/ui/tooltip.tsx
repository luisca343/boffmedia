"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

type TooltipVariant = "default" | "wingull"

const TooltipProvider = TooltipPrimitive.Provider

interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  variant?: TooltipVariant;
}

const TooltipVariantContext = React.createContext<TooltipVariant>("default")

const Tooltip = ({ children, variant = "default", ...props }: TooltipProps) => {
  return (
    <TooltipVariantContext.Provider value={variant}>
      <TooltipPrimitive.Root {...props}>
        {children}
      </TooltipPrimitive.Root>
    </TooltipVariantContext.Provider>
  )
}

const TooltipTrigger = TooltipPrimitive.Trigger

const useTooltipVariant = () => React.useContext(TooltipVariantContext)

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const variant = useTooltipVariant()
  
  const variantStyles = {
    default: "border-surface-700 bg-surface-800 text-surface-300",
    wingull: "border-blue-700 bg-blue-900 text-blue-300",
  }
  
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
export type { TooltipVariant }