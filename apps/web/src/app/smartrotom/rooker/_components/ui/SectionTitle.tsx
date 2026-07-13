import type { ReactNode } from "react"
import { Icon, type IconName } from "./Icon"

/**
 * The heading on a rail box or a profile section. There is no display face in Rooker —
 * hierarchy is weight, so this is an 800 at 20px with an accent glyph, not a second
 * font family.
 */
export interface SectionTitleProps {
  icon: IconName
  title: string
  action?: ReactNode
}

export function SectionTitle({ icon, title, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[20px] font-extrabold tracking-[-.01em] text-rk-fg">
        <Icon name={icon} size={16} className="flex-none text-rk-accent" />
        {title}
      </h2>
      {action}
    </div>
  )
}
