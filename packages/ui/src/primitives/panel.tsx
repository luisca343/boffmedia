import * as React from "react"
import { cn } from "../cn"

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode
  aside?: React.ReactNode
  flat?: boolean
  hover?: boolean
  bodyClassName?: string
}

export function Panel({ title, aside, flat, hover, className, bodyClassName, children, ...rest }: PanelProps) {
  return (
    <section
      className={cn(
        "bg-panel border border-solid border-line transition-[background,border-color] duration-[260ms]",
        !flat && "cut-corner",
        hover && "cursor-pointer relative hover:border-accent-line hover:bg-panel-2",
        className,
      )}
      {...rest}
    >
      {title && (
        <header className="flex items-center gap-3 py-[14px] px-5 border-b border-solid border-line">
          <h3 className="font-display text-[16px] font-bold not-italic leading-none uppercase tracking-[0.04em]">{title}</h3>
          {aside && <span className="ml-auto flex items-center gap-2">{aside}</span>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  )
}
