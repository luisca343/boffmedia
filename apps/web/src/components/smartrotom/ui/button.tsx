import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  cn(
    "cut cut-edge-slant [--cut-w:2px] relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-display font-bold not-italic uppercase tracking-[0.08em] leading-none",
    "border-2 border-solid no-underline",
    "transition-[background,border-color,color,transform] duration-[140ms] active:translate-y-px",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sr-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sr-bg",
    "disabled:opacity-45 disabled:pointer-events-none",
  ),
  {
    variants: {
      variant: {
        // filled accent — the primary CTA
        default:
          "bg-sr-accent border-sr-accent [--cut-line:var(--sr-accent)] text-sr-accent-ink hover:bg-sr-accent-bright hover:border-sr-accent-bright hover:[--cut-line:var(--sr-accent-bright)]",
        // outline — neutral / secondary action
        neutral:
          "bg-transparent border-sr-line-2 [--cut-line:var(--sr-line-2)] text-sr-txt hover:border-sr-accent hover:[--cut-line:var(--sr-accent)] hover:text-sr-accent-bright",
        // soft-filled, borderless — low-emphasis inline action
        noShadow:
          "bg-sr-accent-soft border-transparent [--cut-line:transparent] text-sr-accent-bright hover:bg-sr-panel-2",
        // text-only
        ghost:
          "bg-transparent border-transparent [--cut-line:transparent] text-sr-txt-muted hover:text-sr-accent-bright",
        danger:
          "bg-transparent border-sr-bad [--cut-line:var(--sr-bad)] text-sr-bad hover:bg-sr-bad hover:text-white hover:border-sr-bad",
      },
      size: {
        default: "[--cut:9px] py-2.5 px-5 text-[0.8125rem]",
        sm: "[--cut:7px] py-2 px-3.5 text-[0.75rem]",
        lg: "[--cut:11px] py-3.5 px-8 text-[0.9375rem]",
        icon: "[--cut:7px] h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const SmartRotomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
SmartRotomButton.displayName = "SmartRotomButton"

export { SmartRotomButton, buttonVariants }
