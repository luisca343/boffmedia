"use client"

import { useRef } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import type { RandomizerSettings } from "@boffmedia/pack-schema"
import { cn } from "@/lib/utils"
import { CATEGORIES } from "./catalog"
import { categoryCount } from "./catalog-view"
import { useRandomizerUi } from "./RandomizerUiContext"

/**
 * The horizontal category tab bar. Each tab shows an orange count badge with
 * the number of settings changed from their defaults in that category.
 * ←/→ move selection when a tab is focused.
 */
export function CategoryRail() {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const form = useFormContext<RandomizerSettings>()
  const values = useWatch({ control: form.control }) as Record<string, unknown>
  const barRef = useRef<HTMLElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const i = CATEGORIES.findIndex((c) => c.id === ui.activeCat)
    const next =
      e.key === "ArrowRight" ? Math.min(CATEGORIES.length - 1, i + 1) : Math.max(0, i - 1)
    const id = CATEGORIES[next].id
    ui.setActiveCat(id)
    ui.setQuery("")
    barRef.current?.querySelector<HTMLButtonElement>(`[data-cat="${id}"]`)?.focus()
  }

  return (
    <nav
      ref={barRef}
      onKeyDown={onKeyDown}
      className="flex flex-wrap gap-1 border border-t-0 border-solid border-line bg-panel p-1.5"
    >
      {CATEGORIES.map((cat) => {
        const n = categoryCount(cat, values ?? {})
        const active = cat.id === ui.activeCat && !ui.query.trim()
        return (
          <button
            key={cat.id}
            type="button"
            data-cat={cat.id}
            onClick={() => {
              ui.setActiveCat(cat.id)
              ui.setQuery("")
            }}
            className={cn(
              "flex items-center gap-2 py-2 px-3.5 border border-solid font-display font-bold uppercase tracking-[0.04em] text-[0.8125rem] cursor-pointer",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
              active
                ? "border-accent-line bg-accent-soft text-accent"
                : "border-transparent text-txt-muted hover:text-txt",
            )}
          >
            <Icon name={cat.icon} size={15} className={active ? "text-accent" : "text-txt-dim"} />
            <span>{t(cat.labelKey)}</span>
            {n > 0 && (
              <span className="grid place-items-center min-w-[1.125rem] h-4 px-1.5 bg-accent text-accent-ink font-mono text-[0.59375rem] font-bold">
                {n}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
