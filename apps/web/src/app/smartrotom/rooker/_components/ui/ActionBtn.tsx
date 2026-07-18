"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"
import { useFormat } from "../../_hooks/useFormat"

/**
 * One control in a post's action bar: reply, retrino, views, bookmark, share.
 *
 * The interaction is Twitter's, and it is more particular than it looks — the glyph
 * sits in a 30px disc that stays invisible until hover, when it washes with the
 * control's *own* colour (blue for reply, green for retrino) while the label tints to
 * match. Colour is therefore a property of the action, not of the theme, and each
 * variant is a literal class pair rather than an interpolated one (§4).
 */
export type ActionTone = "accent" | "rt" | "heart"

const TONE: Record<ActionTone, { on: string; wash: string }> = {
  accent: { on: "group-hover:text-rk-accent", wash: "group-hover:bg-rk-accent/15" },
  rt: { on: "group-hover:text-rk-rt", wash: "group-hover:bg-rk-rt/15" },
  heart: { on: "group-hover:text-rk-heart", wash: "group-hover:bg-rk-heart/15" },
}

const ACTIVE: Record<ActionTone, string> = {
  accent: "text-rk-accent",
  rt: "text-rk-rt",
  heart: "text-rk-heart",
}

export interface ActionBtnProps {
  /** An icon name, or a fully custom glyph (the reaction control passes its own). */
  icon: IconName | ReactNode
  count?: number
  tone?: ActionTone
  active?: boolean
  /** Off for the reaction control, whose glyph handles its own fill. */
  fillActive?: boolean
  label: string
  onClick?: () => void
}

export function ActionBtn({
  icon,
  count,
  tone = "accent",
  active = false,
  fillActive = true,
  label,
  onClick,
}: ActionBtnProps) {
  const { fmt } = useFormat()
  const t = TONE[tone]
  return (
    <button
      type="button"
      onClick={(e) => {
        // The whole card is a click target that opens the post — an action must not
        // also navigate.
        e.stopPropagation()
        onClick?.()
      }}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-rk-pill p-[5px] text-[13px] font-semibold tabular-nums",
        "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rk-accent",
        active ? ACTIVE[tone] : "text-rk-fg-subtle",
        t.on,
      )}
    >
      <span className={cn("grid h-[30px] w-[30px] place-items-center rounded-full transition-colors", t.wash)}>
        {typeof icon === "string" ? (
          <Icon name={icon as IconName} size={18} fill={active && fillActive} />
        ) : (
          icon
        )}
      </span>
      {count != null && <span className="min-w-[14px] text-left">{count ? fmt(count) : ""}</span>}
    </button>
  )
}
