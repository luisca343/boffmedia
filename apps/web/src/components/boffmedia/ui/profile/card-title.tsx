"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface CardTitleProps {
  icon?: string
  children: React.ReactNode
  right?: React.ReactNode
  style?: React.CSSProperties
}

export function CardTitle({ icon, children, right, style }: CardTitleProps) {
  if (right !== undefined) {
    return (
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-[0.6rem] text-lg m-0" style={style}>
          {icon && <Icon name={icon} size={18} className="text-[var(--orange-500)]" />}
          {children}
        </h3>
        {right}
      </div>
    )
  }
  return (
    <h3 className="flex items-center gap-[0.6rem] text-lg m-0 mb-5" style={style}>
      {icon && <Icon name={icon} size={18} className="text-[var(--orange-500)]" />}
      {children}
    </h3>
  )
}
