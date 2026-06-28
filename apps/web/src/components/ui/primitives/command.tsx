"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/primitives/dialog"

type CommandVariant = "default" | "wingull" | "boff"

const CommandVariantContext = React.createContext<CommandVariant>("default")

interface CommandProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  variant?: CommandVariant;
}

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-layer-2 text-ink",
    wingull: "bg-secondary-soft text-secondary-hover",
    boff: "bg-layer-2 text-ink",
  }

  return (
    <CommandVariantContext.Provider value={variant}>
      <CommandPrimitive
        ref={ref}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    </CommandVariantContext.Provider>
  )
})
Command.displayName = CommandPrimitive.displayName

const useCommandVariant = () => React.useContext(CommandVariantContext)

interface CommandDialogProps extends DialogProps {
  variant?: CommandVariant;
}

const CommandDialog = ({ children, variant = "default", ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command variant={variant} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-muted [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 dark:[&_[cmdk-group-heading]]:text-ink-muted">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  dark?: boolean;
  className?: string;
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(({ dark, className, ...props }, ref) => {
  const variant = useCommandVariant()
  
  const variantStyles = {
    default: "border-edge text-primary-hover placeholder:text-ink-muted",
    wingull: "border-secondary-active text-secondary-hover placeholder:text-secondary",
    boff: "border-edge/60 text-ink placeholder:text-ink-muted",
  }

  return (
    <div className="relative flex items-center border-b" cmdk-input-wrapper="">
      <Search className={cn(
        "absolute left-3 h-4 w-4 opacity-50",
        variant === "default" ? "text-primary-hover" : variant === "boff" ? "text-secondary-hover" : "text-secondary-hover"
      )} />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 pl-10 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    </div>
  )
})

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => {
  const variant = useCommandVariant()
  
  const variantStyles = {
    default: "text-primary-hover",
    wingull: "text-secondary-hover",
    boff: "text-ink-muted",
  }

  return (
    <CommandPrimitive.Empty
      ref={ref}
      className={cn("py-6 text-center text-sm", variantStyles[variant])}
      {...props}
    />
  )
})

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => {
  const variant = useCommandVariant()
  
  const variantStyles = {
    default: "text-primary-hover [&_[cmdk-group-heading]]:text-ink-muted",
    wingull: "text-secondary-hover [&_[cmdk-group-heading]]:text-secondary-hover",
    boff: "text-ink [&_[cmdk-group-heading]]:text-ink-muted",
  }

  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const variant = useCommandVariant()
  
  const variantStyles = {
    default: "bg-layer-3",
    wingull: "bg-secondary-soft",
    boff: "bg-secondary/15",
  }

  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 h-px", variantStyles[variant], className)}
      {...props}
    />
  )
})
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => {
  const variant = useCommandVariant()
  
  const variantStyles = {
    default: "text-primary-hover data-[selected=true]:bg-layer-1 data-[selected=true]:text-primary-hover",
    wingull: "text-secondary-hover data-[selected=true]:bg-secondary-soft data-[selected=true]:text-secondary-hover",
    boff: "text-ink data-[selected=true]:bg-layer-3 data-[selected=true]:text-secondary-hover",
  }

  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  const variant = useCommandVariant()
  
  const variantStyles = {
    default: "text-ink-muted",
    wingull: "text-secondary-hover",
    boff: "text-ink-muted",
  }

  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

export type { CommandVariant }