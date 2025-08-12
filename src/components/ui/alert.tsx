import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type AlertVariant = "default" | "wingull"

const AlertVariantContext = React.createContext<AlertVariant>("default")

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "border-surface-700 bg-surface-800 text-surface-300 [&>svg]:text-primary-400",
        destructive:
          "border-red-500/50 text-red-500 [&>svg]:text-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps extends 
  React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof alertVariants> {
  uiVariant?: AlertVariant;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, uiVariant = "default", ...props }, ref) => (
    <AlertVariantContext.Provider value={uiVariant}>
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    </AlertVariantContext.Provider>
  )
)
Alert.displayName = "Alert"

const useAlertVariant = () => React.useContext(AlertVariantContext)

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const variant = useAlertVariant()
  
  const variantStyles = {
    default: "text-primary-300",
    wingull: "text-secondary-300",
  }

  return (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", variantStyles[variant], className)}
      {...props}
    />
  )
})
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const variant = useAlertVariant()
  
  const variantStyles = {
    default: "text-surface-400",
    wingull: "text-secondary-200",
  }

  return (
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", variantStyles[variant], className)}
      {...props}
    />
  )
})
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
export type { AlertVariant }