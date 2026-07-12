import * as React from "react"
import { cn } from "@/lib/utils"

export interface SmartRotomPanelProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode
  aside?: React.ReactNode
  flat?: boolean
  bodyClassName?: string
}

export function SmartRotomPanel({
  title,
  aside,
  flat,
  className,
  bodyClassName,
  children,
  ...rest
}: SmartRotomPanelProps) {
  return (
    <section
      className={cn(
        "bg-sr-panel border border-solid border-sr-line transition-[background,border-color] duration-[240ms]",
        !flat && "cut-corner",
        className,
      )}
      {...rest}
    >
      {title && (
        <header className="flex items-center gap-2 py-3 px-4 border-b border-solid border-sr-line">
          <h3 className="font-display text-[14px] font-bold not-italic uppercase tracking-[0.06em] leading-none text-sr-txt">
            {title}
          </h3>
          {aside && <span className="ml-auto flex items-center gap-2">{aside}</span>}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  )
}
