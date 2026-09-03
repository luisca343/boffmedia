import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  cn(
    "cut cut-edge-slant [--cut:5px] inline-flex items-center justify-center gap-1",
    "font-display font-bold not-italic uppercase tracking-[0.08em] leading-none",
    "text-[0.6875rem] px-2 py-1 border border-solid transition-colors",
  ),
  {
    variants: {
      variant: {
        default: "bg-sr-accent border-sr-accent [--cut-line:var(--sr-accent)] text-sr-accent-ink",
        neutral: "bg-sr-panel-2 border-sr-line [--cut-line:var(--sr-line)] text-sr-txt",
        button:
          "bg-sr-accent-soft border-sr-accent-line [--cut-line:var(--sr-accent-line)] text-sr-accent-bright cursor-pointer hover:bg-sr-accent hover:text-sr-accent-ink hover:border-sr-accent hover:[--cut-line:var(--sr-accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function SmartRotomBadge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { SmartRotomBadge, badgeVariants }
