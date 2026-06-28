"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

type TabsVariant = "default" | "wingull"

const TabsVariantContext = React.createContext<TabsVariant>("default")

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant;
}

const Tabs = ({ children, variant = "default", ...props }: TabsProps) => {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.Root {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabsVariantContext.Provider>
  )
}

const useTabsVariant = () => React.useContext(TabsVariantContext)

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const variant = useTabsVariant()

  const variantStyles = {
    default: "bg-layer-2/80 border border-edge/60 text-ink-muted",
    wingull: "bg-secondary-soft border border-secondary-active/60 text-secondary-hover"
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg p-1 gap-0.5",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = useTabsVariant()

  const variantStyles = {
    default: "ring-offset-base focus-visible:ring-primary text-ink-muted hover:text-ink data-[state=active]:bg-layer-3 data-[state=active]:text-primary-hover data-[state=active]:shadow-[0_0_0_1px_rgb(var(--primary-500)/0.25),0_2px_10px_-3px_rgb(var(--primary-500)/0.35)]",
    wingull: "ring-offset-secondary-soft focus-visible:ring-secondary data-[state=active]:bg-secondary-soft data-[state=active]:text-secondary-hover data-[state=active]:shadow-[0_0_0_1px_rgb(var(--secondary-500)/0.25)]"
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
  const variant = useTabsVariant()

  const variantStyles = {
    default: "ring-offset-base focus-visible:ring-primary text-ink",
    wingull: "ring-offset-secondary-soft focus-visible:ring-secondary text-secondary-hover"
  }

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsVariant }
