"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface StatProps {
  icon?: string
  label: string
  value: string
  delta?: string
  deltaTone?: "up" | "down"
  sub?: string
  className?: string
}

export function Stat({ icon, label, value, delta, deltaTone = "up", sub, className }: StatProps) {
  return (
    <div className={cn("k-stat", className)}>
      <div className="k-stat__top">
        {icon && (
          <span className="k-stat__icon"><Icon name={icon} size={18} /></span>
        )}
        {delta != null && (
          <span className={cn("k-stat__delta", `k-stat__delta--${deltaTone}`)}>
            <Icon name={deltaTone === "down" ? "arrow" : "trending"} size={13} className={deltaTone === "down" ? "rotate-90" : ""} />
            {delta}
          </span>
        )}
      </div>
      <div className="k-stat__value">{value}</div>
      <div className="k-stat__label">{label}</div>
      {sub && <div className="k-stat__sub text-dim">{sub}</div>}
    </div>
  )
}
