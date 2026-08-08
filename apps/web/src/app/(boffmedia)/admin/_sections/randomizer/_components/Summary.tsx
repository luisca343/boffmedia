"use client"

import { useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Button, Icon } from "@boffmedia/ui"
import type { RandomizerSettings } from "@boffmedia/pack-schema"
import { cn } from "@/lib/utils"
import { FIELD_INDEX } from "./catalog"
import { changedControls } from "./catalog-view"
import { humanValue } from "./ControlRenderer"
import { useRandomizerUi } from "./RandomizerUiContext"

const WARN_STYLES: Record<string, string> = {
  info: "border-l-signal bg-signal-soft text-signal",
  warn: "border-l-warn bg-warn-soft text-warn",
  bad: "border-l-bad bg-bad-soft text-bad",
}

function jumpTo(field: string) {
  if (typeof document === "undefined") return
  window.setTimeout(() => {
    document.querySelector(`[data-field="${field}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, 60)
}

function SummaryBody({ onSave, onRun, showClose }: { onSave: () => void; onRun: () => void; showClose?: boolean }) {
  const t = useTranslations("randomizer")
  const ui = useRandomizerUi()
  const form = useFormContext<RandomizerSettings>()
  const values = (useWatch({ control: form.control }) as Record<string, unknown>) ?? {}

  const rows = useMemo(() => changedControls(values), [values])
  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>()
    for (const r of rows) {
      const arr = map.get(r.category.id) ?? []
      arr.push(r)
      map.set(r.category.id, arr)
    }
    return [...map.values()]
  }, [rows])

  const goToField = (catId: string, field: string) => {
    ui.setQuery("")
    ui.setActiveCat(catId)
    ui.requestFlash(field)
    jumpTo(field)
  }

  return (
    <>
      <div className="flex items-center gap-2.5 py-3 px-4 border-b border-solid border-line font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-txt-muted">
        <Icon name="sliders" size={15} className="text-accent" />
        <span>{t("chrome.changes")}</span>
        <span className="ml-auto grid place-items-center min-w-[22px] h-5 px-1.5 bg-accent text-accent-ink text-[11px] font-bold">
          {rows.length}
        </span>
        {showClose && (
          <button
            type="button"
            onClick={() => ui.setSummaryOpen(false)}
            className="grid place-items-center border-0 bg-transparent text-txt-dim hover:text-txt cursor-pointer"
            aria-label={t("chrome.close")}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      {ui.warnings.length > 0 && (
        <div className="flex flex-col">
          {ui.warnings.map((warn, i) => (
            <button
              key={`${warn.field}-${i}`}
              type="button"
              onClick={() => goToField(FIELD_INDEX[warn.field]?.category.id ?? "general", warn.field)}
              className={cn(
                "flex items-start gap-2 py-2.5 px-4 border-l-2 border-solid text-left text-[12px] leading-[1.4] cursor-pointer",
                WARN_STYLES[warn.level],
              )}
            >
              <Icon name={warn.level === "info" ? "info" : "alert"} size={14} className="shrink-0 mt-px" />
              <span>{warn.text}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto py-1.5">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-10 px-5 text-center text-txt-dim">
            <Icon name="check" size={28} />
            <p className="text-[13px] leading-[1.5]">{t("chrome.summaryEmpty")}</p>
          </div>
        ) : (
          grouped.map((catRows) => {
            const cat = catRows[0].category
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 pt-2.5 px-4 pb-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-txt-dim">
                  <Icon name={cat.icon} size={12} className="text-accent" />
                  <span>{t(cat.labelKey)}</span>
                </div>
                {catRows.map((r) => (
                  <div key={r.control.field} className="flex items-center gap-2 py-1.5 px-4 hover:bg-panel-2 group">
                    <button
                      type="button"
                      onClick={() => goToField(cat.id, r.control.field)}
                      className="flex-1 min-w-0 text-left text-[12.5px] text-txt hover:text-accent-bright truncate cursor-pointer border-0 bg-transparent"
                    >
                      {t(r.control.labelKey)}
                    </button>
                    <span className="font-mono text-[11px] text-accent whitespace-nowrap">
                      {humanValue(r.control, r.value, t)}
                    </span>
                    <button
                      type="button"
                      onClick={() => ui.resetField(r.control.field)}
                      title={t("chrome.resetField")}
                      className="grid place-items-center w-[18px] h-[18px] border-0 bg-transparent text-txt-dim hover:text-bad cursor-pointer shrink-0"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-solid border-line p-3 grid gap-2">
        <Button variant="default" size="sm" icon="refresh" className="w-full" onClick={() => ui.resetAll()}>
          {t("chrome.resetAll")}
        </Button>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="flex-1" onClick={onSave}>
            {t("chrome.save")}
          </Button>
          <Button variant="pri" size="sm" icon="play" className="flex-1" onClick={onRun}>
            {t("chrome.run")}
          </Button>
        </div>
      </div>
    </>
  )
}

/** Inline sticky column (rail / tabs layouts). */
export function SummaryColumn({ onSave, onRun }: { onSave: () => void; onRun: () => void }) {
  return (
    <aside className="sticky top-[84px] self-start flex flex-col border border-solid border-line bg-panel max-h-[calc(100vh-104px)]">
      <SummaryBody onSave={onSave} onRun={onRun} />
    </aside>
  )
}

/** Right-edge drawer (master-detail / single-scroll layouts). */
export function SummaryDrawer({ onSave, onRun }: { onSave: () => void; onRun: () => void }) {
  const ui = useRandomizerUi()
  return (
    <>
      {ui.summaryOpen && (
        <div
          className="fixed inset-0 z-[65] bg-black/40"
          onClick={() => ui.setSummaryOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed top-0 right-0 z-[70] h-screen w-[360px] max-w-[92vw] flex flex-col border-l border-solid border-line bg-panel shadow-2xl",
          "transition-transform duration-[260ms]",
          ui.summaryOpen ? "translate-x-0" : "translate-x-[105%]",
        )}
      >
        <SummaryBody onSave={onSave} onRun={onRun} showClose />
      </aside>
    </>
  )
}
