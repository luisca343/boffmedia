"use client"

import { useTranslations } from "next-intl"
import { usePcUi } from "../_stores/pcUiStore"
import type { SmartView } from "../_types/pc.types"
import { hasAnyFilter } from "../_utils/filters"
import { SMART_VIEWS } from "../_utils/smartViews"
import { ChipButton, Icon, toast, type IconName } from "./ui"

export function SmartViewsBar() {
  const t = useTranslations("pc")
  const filters = usePcUi((s) => s.filters)
  const search = usePcUi((s) => s.search)
  const activeView = usePcUi((s) => s.activeView)
  const savedViews = usePcUi((s) => s.savedViews)
  const applyView = usePcUi((s) => s.applyView)
  const saveView = usePcUi((s) => s.saveView)
  const deleteView = usePcUi((s) => s.deleteView)

  const filterActive = hasAnyFilter(filters, search)

  const saveCurrent = () => {
    const name = window.prompt(t("views.savePrompt"))?.trim()
    if (!name) return
    const view: SmartView = {
      id: `sv-${Date.now()}`,
      name,
      icon: "bookmark",
      tone: "text-pc-cyan",
      filters,
      search,
      custom: true,
    }
    saveView(view)
    toast(t("views.saved", { name }), "success")
  }

  const views = [...SMART_VIEWS, ...savedViews]

  return (
    <div className="flex items-center gap-[7px] overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="flex-none pr-0.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-pc-fg-subtle">
        {t("views.title")}
      </span>

      {views.map((v) => {
        const on = activeView?.id === v.id
        return (
          // Hand-rolled rather than a `ChipButton`: the lit skin is the view's own
          // `tone`, so the element must carry exactly one text/border colour class.
          // Two would be decided by Tailwind's emit order, not by this list.
          <button
            key={v.id}
            type="button"
            onClick={() => applyView(v)}
            aria-pressed={on}
            className={[
              "inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-pc-pill border px-[9px] py-1",
              "font-pc text-[11.5px] font-semibold transition-colors focus-visible:outline-none",
              on
                ? `${v.tone} border-current bg-white/[.06]`
                : "border-pc-line-strong bg-pc-panel-2 text-pc-fg-muted hover:text-pc-fg",
            ].join(" ")}
          >
            <Icon name={v.icon as IconName} size={12} className={on ? undefined : v.tone} />
            {v.name}
            {v.custom && on && (
              <span
                role="button"
                tabIndex={0}
                aria-label={t("views.delete", { name: v.name })}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteView(v.id)
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return
                  e.stopPropagation()
                  e.preventDefault()
                  deleteView(v.id)
                }}
                className="ml-0.5 flex cursor-pointer"
              >
                <Icon name="x" size={11} />
              </span>
            )}
          </button>
        )
      })}

      {filterActive && !activeView && (
        <ChipButton onClick={saveCurrent} className="flex-none border-dashed">
          <Icon name="bookmark" size={12} />
          {t("views.save")}
        </ChipButton>
      )}
    </div>
  )
}
