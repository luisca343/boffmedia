import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"

export interface LinkedAccountRowProps {
  icon: IconName
  name: string
  sub: string
  /** brand hue applied to the glyph when linked */
  hue?: string
  linked?: boolean
  end?: React.ReactNode
  className?: string
}

export function LinkedAccountRow({ icon, name, sub, hue, linked, end, className }: LinkedAccountRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[14px] border border-solid border-line bg-base px-[15px] py-3 [[data-theme=light]_&]:bg-panel",
        "cut-tag cut-tag-edge [--cut-line:var(--line)]",
        className,
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 flex-none place-items-center border border-solid border-line-2 cut-seal cut-seal-edge [--cut:7px] [--cut-line:var(--line-2)]",
          linked ? "text-[color:var(--lhue,var(--muted))]" : "text-txt-dim",
        )}
        style={linked && hue ? ({ ["--lhue" as string]: hue } as React.CSSProperties) : undefined}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <b
          className={cn(
            "block font-display text-[15px]/none font-bold uppercase tracking-[0.03em]",
            linked ? "text-txt" : "text-txt-muted",
          )}
        >
          {name}
        </b>
        <span className="mt-1 block font-mono text-[11px]/none font-medium tracking-[0.04em] text-txt-muted">{sub}</span>
      </div>
      {end && <span className="ml-auto flex-none">{end}</span>}
    </div>
  )
}

export interface LinkedAccountsProps {
  children: React.ReactNode
  className?: string
}

export function LinkedAccounts({ children, className }: LinkedAccountsProps) {
  return <div className={cn("grid gap-2", className)}>{children}</div>
}
