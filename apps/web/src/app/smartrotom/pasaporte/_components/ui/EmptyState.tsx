// PAPER. A blank leaf, honestly labelled.

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

export function EmptyState({
  icon,
  title,
  sub,
  className,
}: {
  icon: IconName
  title: string
  sub?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid h-full place-items-center gap-2 text-center text-ps-ink-faint", className)}>
      <div>
        <Icon name={icon} className="mx-auto h-[42px] w-[42px] opacity-50" />
        <p className="mt-2 font-ps-ceremony text-[18px] text-ps-ink-soft">{title}</p>
        {sub && <p className="mt-1 text-[12px] text-ps-ink-faint">{sub}</p>}
      </div>
    </div>
  )
}
