import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export interface PackListItemProps {
  /** Leading media — a glyph (`<Icon/>`) or pack art. Wrapped in a fixed seal box. */
  media?: React.ReactNode
  name: React.ReactNode
  slug?: React.ReactNode
  /** Optional 2-line summary under the header. */
  summary?: React.ReactNode
  /** Footer pills — access + gameType + status. */
  badges?: React.ReactNode
  /** Right-aligned mono count in the footer. */
  count?: React.ReactNode
  selected?: boolean
  /** A = left-bar + tint (recommended); B = full accent outline. */
  variant?: "bar" | "outline"
  onClick?: () => void
  className?: string
}

// Admin pack-list rail item. Selection is a 3px accent left-bar + soft tint
// (variant "bar") or a full accent outline (variant "outline") — never a clipped
// corner, so the name is free to wrap without being sheared. Replaces the `.cut`
// `<button>` in packs-admin.
export function PackListItem({
  media,
  name,
  slug,
  summary,
  badges,
  count,
  selected,
  variant = "bar",
  onClick,
  className,
}: PackListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "block w-full text-left border border-solid border-line border-l-[3px] border-l-transparent bg-panel px-3.5 py-3",
        "transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2",
        selected && variant === "bar" && "border-l-accent bg-accent-soft",
        selected && variant === "outline" && "border-accent-line border-l-accent-line bg-accent-soft",
        className,
      )}
    >
      <span className="flex items-start gap-[11px]">
        {media != null && (
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden border border-solid border-line-2 bg-panel text-accent">
            {media}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className="min-w-0 flex-1 font-display text-[15px] font-bold not-italic uppercase leading-[1.05] tracking-[0.04em] text-txt">
              {name}
            </span>
            <Icon name="chevronRight" size={14} className="mt-0.5 shrink-0 text-txt-dim" />
          </span>
          {slug != null && (
            <span className="mt-[3px] block font-mono text-[10px] tracking-[0.02em] text-txt-dim">{slug}</span>
          )}
        </span>
      </span>

      {summary != null && (
        <span className="mt-2 line-clamp-2 block text-[12.5px] leading-[1.4] text-txt-muted">{summary}</span>
      )}

      {(badges != null || count != null) && (
        <span className="mt-[11px] flex flex-wrap items-center gap-1.5 border-t border-solid border-line pt-2.5">
          {badges}
          {count != null && <span className="ml-auto font-mono text-[10px] text-txt-dim">{count}</span>}
        </span>
      )}
    </button>
  )
}
