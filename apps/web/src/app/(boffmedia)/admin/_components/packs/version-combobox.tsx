"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Badge, Icon, Input, Spinner, cn } from "@boffmedia/ui"

// A typeahead over a fetched-once list. Deliberately NOT a <select>: the
// Minecraft manifest is ~900 entries and the Forge list per version is
// hundreds, both of which a native select makes unusable.

export type ComboOption = {
  value: string
  /** Rendered right of the value, e.g. a release date. */
  meta?: string
  /** "latest"/"recommended"/"snapshot" — shown as a badge. */
  tag?: string
  tagTone?: "ok" | "info" | "warn"
}

export function VersionCombobox({
  value,
  onChange,
  options,
  loading,
  disabled,
  placeholder,
  emptyLabel,
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: ComboOption[]
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  emptyLabel?: string
  id?: string
}) {
  const t = useTranslations("admin.packs")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  // The field is controlled from outside too (clone, reset, loader change), so
  // an external change has to win over whatever was half-typed.
  useEffect(() => setDraft(value), [value])

  const filtered = useMemo(() => {
    const needle = draft.trim().toLowerCase()
    // An exact match means "showing the current value", not "filtering to it" —
    // otherwise reopening the list after picking shows a single row.
    if (!needle || options.some((o) => o.value.toLowerCase() === needle)) return options
    return options.filter((o) => o.value.toLowerCase().includes(needle))
  }, [draft, options])

  useEffect(() => {
    if (!open) return
    const onDocDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [open])

  const commit = (next: string) => {
    onChange(next)
    setDraft(next)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const delta = event.key === "ArrowDown" ? 1 : -1
      setActive((current) => {
        const next = current + delta
        return next < 0 ? filtered.length - 1 : next >= filtered.length ? 0 : next
      })
      return
    }
    if (event.key === "Enter" && open && filtered[active]) {
      event.preventDefault()
      commit(filtered[active].value)
      return
    }
    if (event.key === "Escape" && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setDraft(e.target.value)
          setActive(0)
          setOpen(true)
          // Free text stays legal: a brand-new loader build can exist before our
          // cached list knows about it.
          onChange(e.target.value)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-txt-dim">
        {loading ? <Spinner size={14} /> : <Icon name="chevronDown" size={14} />}
      </span>

      {open && !disabled && (
        <ul className="absolute z-50 mt-1 max-h-[16.25rem] w-full overflow-auto border border-solid border-line bg-panel shadow-lg">
          {loading && filtered.length === 0 ? (
            <li className="px-3 py-2 font-mono text-[0.6875rem] text-txt-dim">{t("loading")}</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 font-mono text-[0.6875rem] text-txt-dim">
              {emptyLabel ?? t("noVersions")}
            </li>
          ) : (
            filtered.slice(0, 300).map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  // onMouseDown, not onClick: the input's blur would close the
                  // list before a click ever lands.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    commit(option.value)
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-[0.375rem] text-left",
                    index === active && "bg-panel-2",
                    option.value === value && "text-acc",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-[0.75rem]">
                    {option.value}
                  </span>
                  {option.tag && (
                    <Badge tone={option.tagTone ?? "info"} className="shrink-0">
                      {option.tag}
                    </Badge>
                  )}
                  {option.meta && (
                    <span className="shrink-0 font-mono text-[0.6875rem] text-txt-dim">
                      {option.meta}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
