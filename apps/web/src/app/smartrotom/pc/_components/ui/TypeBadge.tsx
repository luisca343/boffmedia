import { useTranslations } from "next-intl"

import { typeColor } from "../../_utils/typeColors"

export interface TypeBadgeProps {
  type: string
  size?: "sm" | "md"
}

/**
 * The type colours are data, so they are applied inline — an interpolated
 * `bg-${type}-500` would silently never compile.
 */
// `pokedex` is the type chart's namespace; `type_*` lives in its CORE file, so it
// resolves off-prefix here too.
export function TypeBadge({ type, size = "md" }: TypeBadgeProps) {
  const tr = useTranslations("pokedex")
  const t = type.toLowerCase()
  const { c, t: fg } = typeColor(t)
  return (
    <span
      className={[
        "inline-flex items-center rounded-pc-pill font-pc font-bold tracking-[.02em]",
        size === "sm" ? "px-[7px] py-[2px] text-[10px]" : "px-[9px] py-[3px] text-[11px]",
      ].join(" ")}
      style={{ background: c, color: fg, boxShadow: `0 2px 8px -2px ${c}99` }}
    >
      {tr(`type_${t}`)}
    </span>
  )
}
