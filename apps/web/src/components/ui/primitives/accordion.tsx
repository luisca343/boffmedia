"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type AccordionVariant = "default" | "wingull"

const AccordionVariantContext = React.createContext<AccordionVariant>("default")

interface AccordionProps extends AccordionPrimitive.AccordionSingleProps {
  variant?: AccordionVariant;
}

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ variant = "default", ...props }, ref) => {
  return (
    <AccordionVariantContext.Provider value={variant}>
      <AccordionPrimitive.Root ref={ref} {...props} />
    </AccordionVariantContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const useAccordionVariant = () => React.useContext(AccordionVariantContext)

interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}
interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}
interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => {
  const variant = useAccordionVariant()

  const variantStyles = {
    default: "border-b border-surface-700/70 transition-all duration-300",
    wingull: "border-b border-secondary-700 transition-all duration-300",
  }

  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => {
  const variant = useAccordionVariant()

  const variantStyles = {
    default: "text-surface-300 hover:text-primary-300 data-[state=open]:text-primary-300",
    wingull: "text-secondary-300 hover:text-secondary-400 data-[state=open]:text-secondary-300",
  }

  const chevronStyles = {
    default: "text-primary-500",
    wingull: "text-secondary-500",
  }

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all duration-200",
          "[&[data-state=open]>svg]:rotate-180",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out",
            chevronStyles[variant]
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => {
  const variant = useAccordionVariant()

  const variantStyles = {
    default: "text-surface-400",
    wingull: "text-secondary-300",
  }

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-sm",
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        "transition-all duration-300 ease-in-out",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0 pl-1">
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
export type { AccordionVariant }
