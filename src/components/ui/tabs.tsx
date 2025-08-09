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
    default: "bg-surface-800 text-surface-400",
    wingull: "bg-secondary-900 text-secondary-400"
  }
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md p-1",
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
    default: "ring-offset-surface-950 focus-visible:ring-primary-300 data-[state=active]:bg-surface-700 data-[state=active]:text-primary-300",
    wingull: "ring-offset-secondary-950 focus-visible:ring-secondary-300 data-[state=active]:bg-secondary-800 data-[state=active]:text-secondary-300"
  }
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm",
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
    default: "ring-offset-surface-950 focus-visible:ring-primary-300 text-primary-400",
    wingull: "ring-offset-secondary-950 focus-visible:ring-secondary-300 text-secondary-300"
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