"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  ticks?: boolean
}

export function BoffCard({ className, hover, ticks, children, ...props }: BoffCardProps) {
  return (
    <div className={cn("card", hover && "card--hover", ticks && "card--ticks", className)} {...props}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />
      {children}
    </div>
  )
}
