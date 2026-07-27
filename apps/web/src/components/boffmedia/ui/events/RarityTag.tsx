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
        "inline-flex items-center px-2 py-[5px] font-mono text-[9.5px]/none font-bold uppercase tracking-[0.12em]",
        "border border-solid text-[color:var(--rc,var(--muted))] bg-[color:var(--rs,var(--panel-2))]",
        "border-[color:color-mix(in_srgb,var(--rc,var(--line-2))_40%,transparent)]",
        "cut [--cut:4px]",
        className,
      )}
    >
      {label}
    </span>
  )
}
