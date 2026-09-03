import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"

export interface EmptyProps {
  icon?: IconName
  title: React.ReactNode
  lead?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function Empty({ icon = "info", title, lead, children, className }: EmptyProps) {
  return (
    <div className={cn("text-center py-[5.625rem] px-6", className)}>
      <Icon name={icon} size={40} className="text-txt-dim mx-auto mb-[1.125rem]" />
      <h2 className="font-display font-extrabold italic uppercase tracking-[-0.005em] text-[2.75rem]/[0.92] mt-3 mb-[0.625rem]">
        {title}
      </h2>
      {lead && <p className="text-txt-muted max-w-[52ch] mx-auto mb-[1.625rem] text-pretty">{lead}</p>}
      {children && <div className="flex gap-[0.875rem] justify-center flex-wrap">{children}</div>}
    </div>
  )
}
