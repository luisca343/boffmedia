"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind?: "new" | "soon" | "live" | "accent" | "neutral"
}

export function BoffBadge({ className, kind, children, ...props }: BoffBadgeProps) {
  if (kind) {
    const kindClass: Record<string, string> = {
      new: "badge--new",
      soon: "badge--soon",
      live: "badge--live",
      accent: "badge--accent",
      neutral: "",
    }
    return (
      <span className={cn("badge", kindClass[kind], className)} {...props}>
        {(kind === "live" || kind === "new") && <span className="dot" />}
        {children}
      </span>
    )
  }
  return <span className={cn("badge", className)} {...props}>{children}</span>
}
