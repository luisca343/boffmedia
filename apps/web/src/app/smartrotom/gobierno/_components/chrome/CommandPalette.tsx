"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Icon, ThemedLayer } from "../ui"
import { FLAT_MODULES, hrefOf } from "../../_utils/nav"
import { DEPARTMENTS, TONES } from "../../_utils/tones"
import { useOfficer } from "../../_hooks/useOfficer"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"

// ⌘K over every module in the government. Deliberately modules only — a citizen is found
// through the Censo, which is itself one keystroke away.
export function CommandPalette() {
  const t = useTranslations("gobierno")
  const router = useRouter()
  const { isAdmin } = useOfficer()
  const open = useGobiernoUi((s) => s.cmdOpen)
  const setOpen = useGobiernoUi((s) => s.setCmdOpen)
  const [q, setQ] = useState("")
  const [cursor, setCursor] = useState(0)

  const modules = useMemo(() => FLAT_MODULES.filter((m) => !m.restricted || isAdmin), [isAdmin])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return modules
    return modules.filter(
      (m) => t(m.labelKey).toLowerCase().includes(needle) || t(m.groupKey).toLowerCase().includes(needle),
    )
  }, [q, modules, t])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  useEffect(() => {
    if (open) {
      setQ("")
      setCursor(0)
    }
  }, [open])

  useEffect(() => setCursor(0), [q])

  if (!open || typeof document === "undefined") return null

  const go = (slug: string) => {
    router.push(hrefOf(slug))
    setOpen(false)
  }

  return createPortal(
    <ThemedLayer>
      <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-[12vh]">
        <div className="absolute inset-0 bg-gt-ink-900/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden="true" />

        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("commandPalette.ariaLabel")}
          className="gt-edge-gold relative w-full max-w-[33.75rem] animate-gt-pop-scale overflow-hidden rounded-gt border border-gt-line-strong bg-gt-paper-0 shadow-gt-lg motion-reduce:animate-none"
        >
          <div className="flex items-center gap-2.5 border-b border-gt-line px-4 py-3">
            <Icon name="search" size={17} className="flex-none text-gt-ink-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setCursor((c) => Math.min(c + 1, results.length - 1))
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setCursor((c) => Math.max(c - 1, 0))
                } else if (e.key === "Enter" && results[cursor]) {
                  go(results[cursor].slug)
                }
              }}
              placeholder={t("commandPalette.searchPlaceholder")}
              aria-label={t("commandPalette.searchPlaceholder")}
              className="flex-1 bg-transparent text-[0.875rem] text-gt-ink-900 outline-none placeholder:text-gt-ink-400"
            />
            <span className="rounded border border-gt-line-strong px-1.5 py-px font-gt-mono text-[0.625rem] text-gt-ink-400">
              ESC
            </span>
          </div>

          <div className="gt-scroll max-h-[50vh] overflow-y-auto py-1.5">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-[0.8125rem] text-gt-ink-400">
                {t("commandPalette.noResults", { query: q })}
              </div>
            ) : (
              results.map((m, i) => {
                const tone = TONES[DEPARTMENTS[m.dep].tone]
                return (
                  <button
                    key={m.slug}
                    type="button"
                    onClick={() => go(m.slug)}
                    onMouseEnter={() => setCursor(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === cursor ? "bg-gt-paper-2" : ""
                    }`}
                  >
                    <Icon name={m.icon} size={16} className={`flex-none ${tone.text}`} />
                    <span className="flex-1 text-[0.84375rem] font-semibold text-gt-ink-900">{t(m.labelKey)}</span>
                    <span className="font-gt-mono text-[0.59375rem] uppercase tracking-[.12em] text-gt-ink-400">
                      {t(m.groupKey)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </ThemedLayer>,
    document.body,
  )
}
