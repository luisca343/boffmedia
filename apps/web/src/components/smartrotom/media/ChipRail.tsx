"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMediaTheme } from "./_theme"
import { Chip } from "./ui/Chip"

const CHIPS: Record<string, string[]> = {
  mewtube: ["Todo", "Tendencias", "Pixelmon", "Competitivo", "Tutoriales", "Showdown", "Música", "Speedruns", "Directos", "TCG"],
  mewtwitch: ["Todo", "En directo", "Showdown", "Pixelmon", "Speedrun", "TCG", "Charlas", "Torneos", "Retro", "Co-op"],
}

/** Discovery chip rail — clicking a chip searches that term (real navigation). */
export function ChipRail() {
  const theme = useMediaTheme()
  const router = useRouter()
  const items = CHIPS[theme.id]
  const [active, setActive] = useState(items[0])

  const pick = (c: string) => {
    setActive(c)
    router.push(c === "Todo" ? theme.basePath : `${theme.basePath}?q=${encodeURIComponent(c)}`)
  }

  return (
    <div className="mw-scroll sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-mw-line px-4 py-3 backdrop-blur-[10px] bg-[color-mix(in_srgb,rgb(var(--mw-accent))_7%,rgb(var(--mw-bg))/.9)] md:px-6">
      {items.map((c) => (
        <Chip key={c} active={active === c} tone="solid" onClick={() => pick(c)}>
          {c}
        </Chip>
      ))}
    </div>
  )
}
