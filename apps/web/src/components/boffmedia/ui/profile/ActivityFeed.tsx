import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import type { ActivityData } from "./profile-data"

export type ActivityRowProps = ActivityData & { className?: string }

export function ActivityRow({ icon, text, time, className }: ActivityRowProps) {
  return (
    <div
      className={cn(
        "relative flex gap-[0.9375rem] py-[0.8125rem]",
        "before:absolute before:left-[1.125rem] before:top-10 before:bottom-[-3px] before:w-px before:bg-line before:content-['']",
        "last:before:hidden",
        className,
      )}
    >
      <span className="relative z-[1] grid h-[2.3125rem] w-[2.3125rem] flex-none place-items-center border border-solid border-line-2 bg-panel-2 text-accent cut-seal cut-seal-edge [--cut-line:var(--line-2)] [--cut:8px]">
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-body text-[0.9375rem]/[1.45] text-pretty text-txt [&_b]:font-semibold">{text}</p>
        <span className="mt-[0.3125rem] block font-mono text-[0.625rem]/none font-medium uppercase tracking-[0.1em] text-txt-dim">
          {time}
        </span>
      </div>
    </div>
  )
}

export interface ActivityFeedProps {
  items: ActivityData[]
  className?: string
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  return (
    <div className={cn("relative grid", className)}>
      {items.map((a, i) => (
        <ActivityRow key={i} {...a} />
      ))}
    </div>
  )
}
