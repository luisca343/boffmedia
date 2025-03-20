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
    default: "border-b border-surface-700 transition-all duration-300 hover:border-opacity-80",
    wingull: "border-b border-blue-700 transition-all duration-300 hover:border-opacity-80",
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
    default: "text-surface-300 hover:text-primary-400",
    wingull: "text-blue-300 hover:text-blue-400",
  }

  const chevronStyles = {
    default: "text-primary-400",
    wingull: "text-blue-500",
  }

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all duration-300",
          "hover:translate-x-1 active:translate-x-0",
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
            "[data-state=open]_&:animate-pulse",
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
    default: "text-surface-300",
    wingull: "text-blue-200",
  }

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-sm",
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        "transition-all duration-500 ease-in-out",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0 transform transition-transform duration-300 data-[state=open]:translate-y-0 data-[state=closed]:translate-y-2 data-[state=open]:scale-100 data-[state=closed]:scale-95">
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
export type { AccordionVariant }