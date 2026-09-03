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
        <Icon name={icon} className="mx-auto h-[2.625rem] w-[2.625rem] opacity-50" />
        <p className="mt-2 font-ps-ceremony text-[1.125rem] text-ps-ink-soft">{title}</p>
        {sub && <p className="mt-1 text-[0.75rem] text-ps-ink-faint">{sub}</p>}
      </div>
    </div>
  )
}
