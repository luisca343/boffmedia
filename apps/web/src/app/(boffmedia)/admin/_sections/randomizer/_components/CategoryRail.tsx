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
 * The persistent category rail (master-detail / rail layouts) or a horizontal
 * tab bar (tabs layout). Each item shows an orange count badge with the number
 * of settings changed from their defaults in that category. ↑/↓ move selection
 * when the rail is focused.
 */
export function CategoryRail({ variant = "rail" }: { variant?: "rail" | "tabs" }) {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const form = useFormContext<RandomizerSettings>()
  const values = useWatch({ control: form.control }) as Record<string, unknown>
  const railRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const i = CATEGORIES.findIndex((c) => c.id === ui.activeCat)
    const next = e.key === "ArrowDown" ? Math.min(CATEGORIES.length - 1, i + 1) : Math.max(0, i - 1)
    const id = CATEGORIES[next].id
    ui.setActiveCat(id)
    ui.setQuery("")
    railRef.current?.querySelector<HTMLButtonElement>(`[data-cat="${id}"]`)?.focus()
  }

  if (variant === "tabs") {
    return (
      <nav className="flex flex-wrap gap-1 border border-solid border-line bg-panel p-1.5">
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
                "flex items-center gap-2 py-2 px-3.5 border border-solid font-display font-bold uppercase tracking-[0.04em] text-[13px] cursor-pointer",
                active
                  ? "border-accent-line bg-accent-soft text-accent"
                  : "border-transparent text-txt-muted hover:text-txt",
              )}
            >
              <span>{t(cat.labelKey)}</span>
              {n > 0 && (
                <span className="grid place-items-center min-w-[18px] h-4 px-1.5 bg-accent text-accent-ink font-mono text-[9.5px] font-bold">
                  {n}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <div
      ref={railRef}
      onKeyDown={onKeyDown}
      className="sticky top-[84px] self-start border border-solid border-line bg-panel p-2 max-h-[calc(100vh-104px)] overflow-auto"
    >
      <p className="px-2.5 pt-2 pb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-txt-dim">
        {t("chrome.categories")}
      </p>
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
              "flex items-center gap-2.5 w-full text-left py-2.5 px-2.5 border-0 border-l-2 border-solid bg-transparent cursor-pointer",
              "font-display font-semibold uppercase tracking-[0.03em] text-[13.5px]",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
              active
                ? "border-l-accent bg-accent-soft text-txt"
                : "border-l-transparent text-txt-muted hover:bg-panel-2 hover:text-txt",
            )}
          >
            <Icon name={cat.icon} size={16} className={active ? "text-accent" : "text-txt-dim"} />
            <span className="flex-1 min-w-0">{t(cat.labelKey)}</span>
            {n > 0 && (
              <span className="grid place-items-center min-w-5 h-[18px] px-1.5 bg-accent text-accent-ink font-mono text-[10px] font-bold">
                {n}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
