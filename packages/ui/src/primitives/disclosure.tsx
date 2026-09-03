"use client"

import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"

export interface DisclosureProps {
  title: React.ReactNode
  icon?: IconName
  sub?: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Disclosure({ title, icon, sub, defaultOpen = false, badge, children, className }: DisclosureProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const panelId = React.useId()
  return (
    <div
      className={cn(
        "border border-solid border-line bg-panel",
        "cut-corner cut-corner-edge [--cut-lg:10px] [--cut-line:var(--line)]",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full py-[0.875rem] px-4 cursor-pointer bg-transparent text-txt text-left hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:-outline-offset-2"
      >
        {icon && (
          <span className="text-accent grid place-items-center">
            <Icon name={icon} size={16} />
          </span>
        )}
        <span className="flex flex-col gap-[2px] flex-1 min-w-0 font-display text-[0.875rem] font-bold leading-[1.1] tracking-[0.03em] uppercase">
          {title}
          {sub && <small className="font-mono text-[0.6875rem] font-normal leading-[1.3] tracking-normal normal-case text-txt-dim">{sub}</small>}
        </span>
        {badge != null && (
          <span className="font-mono text-[0.625rem] font-semibold leading-none uppercase tracking-[0.1em] text-accent border border-solid border-accent-line bg-accent-soft py-1 px-2">
            {badge}
          </span>
        )}
        <Icon
          name="chevronDown"
          size={16}
          className={cn("text-txt-muted flex-none transition-transform duration-[260ms] motion-reduce:transition-none", open && "rotate-180")}
        />
      </button>
      <div id={panelId} hidden={!open} className="pt-1 px-4 pb-[1.125rem] border-t border-solid border-line">
        {children}
      </div>
    </div>
  )
}
