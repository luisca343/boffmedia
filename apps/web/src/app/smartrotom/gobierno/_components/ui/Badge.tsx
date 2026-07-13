import type { ReactNode } from "react"
import { Icon, type IconName } from "./Icon"
import { TONES, type Tone } from "../../_utils/tones"

// The civic chip: a mono, letter-spaced, uppercase stamp. Used for every status,
// severity, category and case reference in the app.
export function Badge({
  children,
  tone = "default",
  solid = false,
  dot = false,
  icon,
  className = "",
}: {
  children: ReactNode
  tone?: Tone
  solid?: boolean
  dot?: boolean
  icon?: IconName
  className?: string
}) {
  const t = TONES[tone]
  const skin = solid
    ? `${t.solidBg} ${t.solidBorder} text-white`
    : `${t.softBg} ${t.softBorder} ${t.text}`

  return (
    <span
      className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-[4px] border px-2 py-px font-gt-mono text-[10px] font-bold uppercase leading-[1.7] tracking-[.1em] ${skin} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${solid ? "bg-white" : t.dot}`} />}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}
