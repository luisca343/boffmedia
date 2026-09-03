"use client"

import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import type { RandomizerSettings } from "@boffmedia/pack-schema"
import { AvPanel } from "../../../_components/ui/av-kit"
import defaultSettings from "../default-settings"
import { CATEGORIES, type RzPanel } from "./catalog"
import { searchControls, type SearchHit } from "./catalog-view"
import { ControlRenderer } from "./ControlRenderer"
import { useRandomizerUi } from "./RandomizerUiContext"

const DEF = defaultSettings as unknown as Record<string, unknown>

function ResetLink({ onClick }: { onClick: () => void }) {
  const t = useTranslations("randomizer")
  return (
    <button
      type="button"
      onClick={onClick}
      title={t("chrome.resetPanel")}
      className="inline-flex items-center gap-1.5 border-0 bg-transparent text-txt-dim hover:text-accent-bright font-mono text-[0.59375rem] font-semibold uppercase tracking-[0.08em] cursor-pointer"
    >
      <Icon name="refresh" size={12} />
      <span>{t("chrome.reset")}</span>
    </button>
  )
}

function Panel({ panel }: { panel: RzPanel }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  const resetPanel = () => {
    for (const c of panel.controls) {
      form.setValue(c.field as never, DEF[c.field] as never, { shouldDirty: true, shouldValidate: true })
    }
  }

  return (
    <AvPanel
      title={t(panel.titleKey)}
      aside={<ResetLink onClick={resetPanel} />}
      bodyClassName="p-0"
      className="mb-4"
    >
      {panel.controls.map((c) => (
        <ControlRenderer key={c.field} control={c} />
      ))}
    </AvPanel>
  )
}

function CategoryHeader({ catId }: { catId: string }) {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const cat = CATEGORIES.find((c) => c.id === catId)
  if (!cat) return null
  return (
    <div className="flex items-start gap-3 mb-3.5 pb-3 border-b border-solid border-line">
      <Icon name={cat.icon} size={22} className="text-accent mt-0.5 shrink-0" />
      <div className="min-w-0">
        <h3 className="font-display font-extrabold italic uppercase text-[1.375rem] leading-none tracking-[0.01em]">
          {t(cat.labelKey)}
        </h3>
        {ui.density !== "compact" && (
          <p className="mt-1 text-txt-muted text-[0.84375rem] max-w-[70ch]">{t(cat.blurbKey)}</p>
        )}
      </div>
    </div>
  )
}

function SearchResults() {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const hits = useMemo(() => searchControls(ui.query, (k) => t(k)), [ui.query, t])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>()
    for (const h of hits) {
      const arr = map.get(h.category.id) ?? []
      arr.push(h)
      map.set(h.category.id, arr)
    }
    return [...map.entries()]
  }, [hits])

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3.5 pb-3 border-b border-solid border-line text-txt-muted text-[0.875rem]">
        <Icon name="search" size={18} className="text-accent" />
        <span>
          <b className="text-txt">{hits.length}</b> {t("chrome.searchMatches", { count: hits.length })}
        </span>
      </div>
      {hits.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 py-10 text-txt-dim text-center">
          <Icon name="search" size={28} />
          <p>{t("chrome.searchNoResults")}</p>
        </div>
      ) : (
        grouped.map(([catId, catHits]) => {
          const cat = catHits[0].category
          return (
            <AvPanel key={catId} title={t(cat.labelKey)} bodyClassName="p-0" className="mb-4">
              {catHits.map((h) => (
                <ControlRenderer key={h.control.field} control={h.control} />
              ))}
            </AvPanel>
          )
        })
      )}
    </div>
  )
}

export function CategoryContent() {
  const ui = useRandomizerUi()

  if (ui.query.trim()) return <SearchResults />

  const cat = CATEGORIES.find((c) => c.id === ui.activeCat) ?? CATEGORIES[0]
  return (
    <div>
      <CategoryHeader catId={cat.id} />
      {cat.panels.map((panel) => (
        <Panel key={panel.titleKey} panel={panel} />
      ))}
    </div>
  )
}
