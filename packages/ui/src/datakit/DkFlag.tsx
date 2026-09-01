"use client"

import { useNsT } from "../i18n"
import { cn } from "../cn"
import { Icon } from "../primitives"

// Country flag emoji with an accessible name. Mirrors `.dk-flag`.
export function DkFlag({ flag, code, name, size = 15 }: { flag?: string; code?: string; name?: string; size?: number }) {
  return (
    <span className="leading-none" title={name || code} style={{ fontSize: size }} aria-label={name || code}>
      {flag || "🏳️"}
    </span>
  )
}

// «Follow» star toggle (the host persists it; this is just the control).
// Mirrors `.dk-pin`.
export function DkPin({ on, onClick, size = 14 }: { on?: boolean; onClick?: () => void; size?: number }) {
  const t = useNsT("common.dkExtras")
  return (
    <button
      type="button"
      aria-pressed={!!on}
      aria-label={on ? t("unfollow") : t("follow")}
      title={on ? t("following") : t("follow")}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        "inline-grid h-[26px] w-[26px] cursor-pointer place-items-center border-0 bg-transparent transition-[color,transform] duration-[140ms] hover:scale-[1.12] hover:text-warn focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-line",
        on ? "text-warn [&_svg]:fill-warn" : "text-txt-dim",
      )}
    >
      <Icon name="star" size={size} />
    </button>
  )
}
