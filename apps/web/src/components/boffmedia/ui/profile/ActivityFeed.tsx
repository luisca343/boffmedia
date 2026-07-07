import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import type { ActivityData } from "./profile-data"

export type ActivityRowProps = ActivityData & { className?: string }

export function ActivityRow({ icon, text, time, className }: ActivityRowProps) {
  return (
    <div
      className={cn(
        "relative flex gap-[15px] py-[13px]",
        "before:absolute before:left-[18px] before:top-10 before:bottom-[-3px] before:w-px before:bg-line before:content-['']",
        "last:before:hidden",
        className,
      )}
    >
      <span className="relative z-[1] grid h-[37px] w-[37px] flex-none place-items-center border border-solid border-line-2 bg-panel-2 text-accent cut [--cut:8px]">
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-body text-[15px]/[1.45] text-pretty text-txt [&_b]:font-semibold">{text}</p>
        <span className="mt-[5px] block font-mono text-[10px]/none font-medium uppercase tracking-[0.1em] text-txt-dim">
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
