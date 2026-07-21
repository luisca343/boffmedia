"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMediaTheme } from "./_theme"
import { Chip } from "./ui/Chip"

const CHIPS: Record<string, string[]> = {
  mewtube: ["all", "trending", "pixelmon", "competitive", "tutorials", "showdown", "music", "speedruns", "streams", "tcg"],
  mewtwitch: ["all", "live", "showdown", "pixelmon", "speedrun", "tcg", "talks", "tournaments", "retro", "coop"],
}

/** Discovery chip rail — clicking a chip searches that term (real navigation). */
export function ChipRail() {
  const theme = useMediaTheme()
  const router = useRouter()
  const t = useTranslations("common.media.chips")
  const items = CHIPS[theme.id]
  const [active, setActive] = useState(items[0])

  const pick = (c: string) => {
    setActive(c)
    router.push(c === "all" ? theme.basePath : `${theme.basePath}?q=${encodeURIComponent(t(c))}`)
  }

  return (
    <div className="mw-scroll sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-mw-line px-4 py-3 backdrop-blur-[10px] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_7%,rgb(var(--mw-bg))/.9)] md:px-6">
      {items.map((c) => (
        <Chip key={c} active={active === c} tone="solid" onClick={() => pick(c)}>
          {t(c)}
        </Chip>
      ))}
    </div>
  )
}
