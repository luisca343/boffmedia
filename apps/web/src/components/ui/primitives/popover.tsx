"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

type PopoverVariant = "default" | "wingull"

const PopoverVariantContext = React.createContext<PopoverVariant>("default")

interface PopoverProps extends PopoverPrimitive.PopoverProps {
  variant?: PopoverVariant;
}

const Popover = ({ children, variant = "default", ...props }: PopoverProps) => {
  return (
    <PopoverVariantContext.Provider value={variant}>
      <PopoverPrimitive.Root {...props}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverVariantContext.Provider>
  )
}

const PopoverTrigger = PopoverPrimitive.Trigger

const usePopoverVariant = () => React.useContext(PopoverVariantContext)

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const variant = usePopoverVariant()
  
  const variantStyles = {
    default: "border-surface-700 bg-surface-800 text-primary-400",
    wingull: "border-secondary-700 bg-secondary-800 text-secondary-300"
  }
  
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border p-4 shadow-md outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
export type { PopoverVariant }