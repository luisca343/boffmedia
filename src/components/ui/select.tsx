"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from 'lucide-react'

import { cn } from "@/lib/utils"

export type SelectVariant = "default" | "wingull"

const SelectVariantContext = React.createContext<SelectVariant>("default")

const useSelectVariant = () => React.useContext(SelectVariantContext)

const getSelectStyles = (variant: SelectVariant = "default") => {
  return {
    trigger: {
      default: "border-surface-700 bg-surface-800 text-primary-400 ring-offset-surface-900 focus:ring-primary-300 placeholder:text-surface-400",
      wingull: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 focus:ring-blue-400 ring-offset-white placeholder:text-blue-400",
    }[variant],
    content: {
      default: "border-surface-700 bg-surface-800 text-primary-400",
      wingull: "border-blue-200 bg-white text-blue-800 shadow-lg",
    }[variant],
    label: {
      default: "text-surface-300",
      wingull: "text-blue-700 font-medium",
    }[variant],
    item: {
      default: "focus:bg-surface-700 text-primary-400 focus:text-primary-300 data-[highlighted]:bg-surface-700 data-[highlighted]:text-primary-300",
      wingull: "focus:bg-blue-100 hover:bg-blue-50 text-blue-800 focus:text-blue-900 data-[highlighted]:bg-blue-100 data-[highlighted]:text-blue-900",
    }[variant],
    separator: {
      default: "bg-surface-700",
      wingull: "bg-blue-100",
    }[variant],
    icon: {
      default: "text-primary-400",
      wingull: "text-blue-600",
    }[variant],
    checkIcon: {
      default: "text-primary-400",
      wingull: "text-blue-600",
    }[variant]
  }
}

// Pass variant as prop
interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  variant?: SelectVariant;
}

const Select = ({ children, variant = "default", ...props }: SelectProps) => (
  <SelectVariantContext.Provider value={variant}>
    <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>
  </SelectVariantContext.Provider>
)

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { variant?: SelectVariant }
>(({ className, children, variant, ...props }, ref) => {
  const contextVariant = useSelectVariant()
  const effectiveVariant = variant || contextVariant
  const styles = getSelectStyles(effectiveVariant)
  
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        styles.trigger,
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className={cn("h-4 w-4 opacity-50", styles.icon)} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { variant?: SelectVariant }
>(({ className, children, position = "popper", variant, ...props }, ref) => {
  const contextVariant = useSelectVariant()
  const effectiveVariant = variant || contextVariant
  const styles = getSelectStyles(effectiveVariant)
  
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          styles.content,
          className
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & { variant?: SelectVariant }
>(({ className, variant, ...props }, ref) => {
  const contextVariant = useSelectVariant()
  const effectiveVariant = variant || contextVariant
  const styles = getSelectStyles(effectiveVariant)
  
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", styles.label, className)}
      {...props}
    />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { variant?: SelectVariant }
>(({ className, children, variant, ...props }, ref) => {
  const contextVariant = useSelectVariant()
  const effectiveVariant = variant || contextVariant
  const styles = getSelectStyles(effectiveVariant)
  
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        styles.item,
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className={cn("h-4 w-4", styles.checkIcon)} />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & { variant?: SelectVariant }
>(({ className, variant, ...props }, ref) => {
  const contextVariant = useSelectVariant()
  const effectiveVariant = variant || contextVariant
  const styles = getSelectStyles(effectiveVariant)
  
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px", styles.separator, className)}
      {...props}
    />
  )
})
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}