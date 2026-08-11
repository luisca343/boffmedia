import * as React from "react"
import { cn } from "../cn"

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode
  aside?: React.ReactNode
  /** Leading media in the header — an icon or thumbnail, left of the title.
   *  Host-agnostic: the caller supplies the node (e.g. a CatalogIcon), the
   *  primitive only reserves the slot. */
  media?: React.ReactNode
  flat?: boolean
  hover?: boolean
  bodyClassName?: string
}

export function Panel({ title, aside, media, flat, hover, className, bodyClassName, children, ...rest }: PanelProps) {
  return (
    <section
      className={cn(
        "bg-panel border border-solid border-line transition-[background,border-color] duration-[260ms]",
        !flat && "cut-corner cut-corner-edge [--cut-line:var(--line)]",
        hover && "cursor-pointer relative hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:bg-panel-2",
        className,
      )}
      {...rest}
    >
      {(title || media) && (
        <header className="flex items-center gap-3 py-[14px] px-5 border-b border-solid border-line">
          {media && <span className="flex shrink-0 items-center">{media}</span>}
          {title && (
            <h3 className="min-w-0 font-display text-[16px] font-bold not-italic leading-none uppercase tracking-[0.04em]">
              {title}
            </h3>
          )}
          {aside && <span className="ml-auto flex items-center gap-2">{aside}</span>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  )
}
