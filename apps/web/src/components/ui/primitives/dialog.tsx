"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from 'lucide-react'

import { cn } from "@/lib/utils"

type DialogVariant = "default" | "wingull"

const DialogVariantContext = React.createContext<DialogVariant>("default")

interface DialogProps extends DialogPrimitive.DialogProps {
  variant?: DialogVariant;
}

const Dialog = ({ children, variant = "default", ...props }: DialogProps) => {
  return (
    <DialogVariantContext.Provider value={variant}>
      <DialogPrimitive.Root {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogVariantContext.Provider>
  )
}

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const useDialogVariant = () => React.useContext(DialogVariantContext)

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const variant = useDialogVariant()
  
  const variantStyles = {
    default: "border-surface-700 bg-surface-800 text-surface-100 ring-offset-surface-900 focus:ring-primary-300",
    wingull: "border-secondary-800 bg-secondary-900 text-secondary-100 ring-offset-secondary-950 focus:ring-secondary-300",
  }
  
  const closeButtonStyles = {
    default: "text-surface-400 focus:ring-primary-300 ring-offset-surface-900 data-[state=open]:bg-surface-800 absolute top-4 right-4 text-purple-300 hover:text-white rounded-full p-2 border shadow-lg transition-all duration-200",
    wingull: "text-secondary-400 focus:ring-secondary-300 ring-offset-secondary-950 data-[state=open]:bg-secondary-900",
  }
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={cn(
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-2 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none",
          closeButtonStyles[variant]
        )}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const variant = useDialogVariant()
  
  const variantStyles = {
    default: "text-primary-300",
    wingull: "text-secondary-300",
  }
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold", variantStyles[variant], className)}
      {...props}
    />
  )
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const variant = useDialogVariant()
  
  const variantStyles = {
    default: "text-surface-400",
    wingull: "text-secondary-400",
  }
  
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm", variantStyles[variant], className)}
      {...props}
    />
  )
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
export type { DialogVariant }