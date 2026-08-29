import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export interface SelectCardProps {
  selected?: boolean
  onChange?: (selected: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Leading glyph, right of the check box. */
  icon?: React.ReactNode
  className?: string
}

// Selectable card (Option B): a check box that fills accent when on, plus an
// accent border + soft tint on the whole card. For a set of independent choices —
// the alternative to FeatureToggle when there's no inline body to reveal.
export function SelectCard({ selected, onChange, title, description, icon, className }: SelectCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!selected}
      onClick={() => onChange?.(!selected)}
      className={cn(
        "flex items-start gap-3 border border-solid bg-panel p-[15px] text-left",
        "transition-[border-color,background] duration-[140ms]",
        "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]",
        selected ? "border-accent bg-accent-soft" : "border-line-2 hover:border-accent-line",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-[22px] shrink-0 place-items-center border border-solid transition-[border-color,background] duration-[140ms]",
          selected ? "border-accent bg-accent text-accent-ink" : "border-line-2 text-transparent",
        )}
      >
        <Icon name="check" size={13} />
      </span>
      {icon != null && (
        <span className="grid size-[38px] shrink-0 place-items-center border border-solid border-line-2 bg-panel text-txt">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[14px] font-bold not-italic uppercase leading-tight tracking-[0.05em] text-txt">
          {title}
        </span>
        {description != null && (
          <span className="mt-1 block text-[12.5px] leading-[1.45] text-txt-dim">{description}</span>
        )}
      </span>
    </button>
  )
}
