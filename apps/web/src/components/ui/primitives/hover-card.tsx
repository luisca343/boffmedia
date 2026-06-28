"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

type HoverCardVariant = "default" | "info" | "warning" | "paper" | "wingull"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & { variant?: HoverCardVariant }
>(({ className, align = "center", sideOffset = 4, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-layer-2 border-edge text-primary-hover",
    info: "bg-secondary-soft border-secondary-active text-secondary-hover",
    warning: "bg-yellow-900 border-yellow-600 text-yellow-100",
    paper: "page border-2 border-black",
    wingull: "bg-secondary-soft border-secondary-active text-secondary-hover"
  }

  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-64 rounded-md border p-4 shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
})
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
export type { HoverCardVariant }