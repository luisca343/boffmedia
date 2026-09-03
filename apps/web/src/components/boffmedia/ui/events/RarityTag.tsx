"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { RARITY } from "./events-util"

// Rarity pill (bronze…diamond) with a tag-cut clip. Mirrors `.ev-rarity`.
export function RarityTag({ rarity, className }: { rarity: string; className?: string }) {
  const t = useTranslations("logros.rarity")
  const key = (rarity || "").toLowerCase()
  const m = RARITY[key] || {}
  const label = key && key in RARITY ? t(key as "bronze" | "silver" | "gold" | "platinum" | "diamond") : rarity
  return (
    <span
      style={{ ["--rc" as string]: m.color, ["--rs" as string]: m.soft } as React.CSSProperties}
      className={cn(
        "inline-flex items-center px-2 py-[0.3125rem] font-mono text-[0.59375rem]/none font-bold uppercase tracking-[0.12em]",
        "border border-solid text-[color:var(--rc,var(--muted))] bg-[color:var(--rs,var(--panel-2))]",
        "border-[color:color-mix(in_srgb,var(--rc,var(--line-2))_40%,transparent)]",
        // The stroke repeats the border colour-mix: the two slants are painted
        // geometry and cannot read the `border-*` utility above.
        "cut cut-edge-slant [--cut:4px] [--cut-line:color-mix(in_srgb,var(--rc,var(--line-2))_40%,transparent)]",
        className,
      )}
    >
      {label}
    </span>
  )
}
