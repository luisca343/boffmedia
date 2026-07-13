"use client"

import { cn } from "@/lib/utils"

/**
 * The segmented tab strip: Para ti / Siguiendo, Trinos / Capturas / Combates / Media.
 *
 * The active tab is marked by a 38×4 accent bar pinned to the bottom edge — deliberately
 * narrower than the tab, so it reads as an underline on the *label* rather than as a
 * selected segment. The strip is sticky and shares the nav's blur.
 */
export interface SegTab<T extends string> {
  key: T
  label: string
}

export interface SegTabsProps<T extends string> {
  tabs: SegTab<T>[]
  active: T
  onChange: (key: T) => void
  className?: string
}

export function SegTabs<T extends string>({ tabs, active, onChange, className }: SegTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "sticky top-0 z-20 flex border-b border-rk-line bg-rk-nav backdrop-blur-md",
        className,
      )}
    >
      {tabs.map((tab) => {
        const on = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative flex-1 px-2 py-3.5 text-[14.5px] transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rk-accent",
              on ? "font-bold text-rk-fg" : "font-semibold text-rk-fg-subtle hover:bg-rk-hover",
            )}
          >
            {tab.label}
            {on && (
              <span className="absolute bottom-0 left-1/2 h-1 w-[38px] -translate-x-1/2 rounded-rk-pill bg-rk-accent" />
            )}
          </button>
        )
      })}
    </div>
  )
}
