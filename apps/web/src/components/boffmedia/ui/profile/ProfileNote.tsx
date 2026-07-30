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
        "mb-[22px] flex items-center gap-3 border border-solid border-accent-line border-l-4 border-l-accent bg-accent-soft px-[18px] py-3",
        "[clip-path:polygon(0_0,100%_0,calc(100%_-_12px)_100%,0_100%)]",
        "font-mono text-[12px]/[1.4] font-medium uppercase tracking-[0.06em] text-txt",
        className,
      )}
    >
      <Icon name={icon} size={18} className="flex-none text-accent" />
      {children}
    </div>
  )
}
