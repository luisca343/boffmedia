import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"

export interface ProfileNoteProps {
  icon?: IconName
  children: React.ReactNode
  className?: string
}

export function ProfileNote({ icon = "eye", children, className }: ProfileNoteProps) {
  return (
    <div
      className={cn(
        "mb-[1.375rem] flex items-center gap-3 border border-solid border-accent-line border-l-4 border-l-accent bg-accent-soft px-[1.125rem] py-3",
        "cut-slant-r cut-edge-slant-r [--cut:12px] [--cut-line:var(--accent-line)]",
        "font-mono text-[0.75rem]/[1.4] font-medium uppercase tracking-[0.06em] text-txt",
        className,
      )}
    >
      <Icon name={icon} size={18} className="flex-none text-accent" />
      {children}
    </div>
  )
}
