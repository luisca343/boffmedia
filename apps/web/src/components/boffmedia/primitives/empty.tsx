import * as React from "react"
import { cn } from "@/lib/utils"
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
    <div className={cn("text-center py-[90px] px-6", className)}>
      <Icon name={icon} size={40} className="text-txt-dim mx-auto mb-[18px]" />
      <h2 className="font-display font-extrabold italic uppercase tracking-[-0.005em] text-[44px]/[0.92] mt-3 mb-[10px]">
        {title}
      </h2>
      {lead && <p className="text-txt-muted max-w-[52ch] mx-auto mb-[26px] text-pretty">{lead}</p>}
      {children && <div className="flex gap-[14px] justify-center flex-wrap">{children}</div>}
    </div>
  )
}
