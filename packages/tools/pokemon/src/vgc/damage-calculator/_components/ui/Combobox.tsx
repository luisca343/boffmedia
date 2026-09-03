"use client"

import * as React from "react"
import { cn } from "@boffmedia/ui/cn"
import { Input } from "@boffmedia/ui"

export interface ComboboxProps<T> {
  value: string
  getItems: (query: string) => T[]
  onPick: (item: T) => void
  renderItem: (item: T) => React.ReactNode
  itemKey: (item: T) => string
  placeholder?: string
  alignRight?: boolean
  ariaLabel?: string
  /** Rendered when no item matches the query. */
  emptyLabel?: (query: string) => React.ReactNode
}

// search input + keyboard-navigable menu (↑/↓/Enter/Esc).
export function Combobox<T>({
  value,
  getItems,
  onPick,
  renderItem,
  itemKey,
  placeholder = "…",
  alignRight,
  ariaLabel,
  emptyLabel,
}: ComboboxProps<T>) {
  const [q, setQ] = React.useState(value || "")
  const [open, setOpen] = React.useState(false)
  const [hi, setHi] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => setQ(value || ""), [value])
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQ(value || "")
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [value])

  const items = React.useMemo(() => (open ? getItems(q.trim().toLowerCase()) : []), [q, open, getItems])
  React.useEffect(() => {
    setHi(0)
  }, [q, open])

  const pick = (it: T) => {
    onPick(it)
    setOpen(false)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHi((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHi((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter" && open && items[hi]) {
      e.preventDefault()
      pick(items[hi])
    } else if (e.key === "Escape") {
      setOpen(false)
      setQ(value || "")
    }
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <Input
        value={q}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%_+_4px)] z-50 max-h-[20rem] w-max min-w-full max-w-[18.75rem] overflow-y-auto border border-solid border-line-2 bg-panel shadow-[var(--shadow)]",
            alignRight ? "right-0" : "left-0",
          )}
          role="listbox"
        >
          {items.length === 0 && (
            <div className="px-[0.875rem] py-3 font-mono text-[0.75rem]/[1.4] text-txt-dim">
              {emptyLabel ? emptyLabel(q) : `— ${q} —`}
            </div>
          )}
          {items.map((it, i) => (
            <button
              key={itemKey(it)}
              type="button"
              role="option"
              aria-selected={i === hi}
              className={cn(
                "flex w-full items-center gap-[0.625rem] px-3 py-2 text-left font-body text-[0.8125rem]/[1.2] text-txt",
                "[&_.tail]:ml-auto [&_.tail]:inline-flex [&_.tail]:items-center [&_.tail]:gap-1 [&_.tail]:font-mono [&_.tail]:text-[0.6875rem]/none [&_.tail]:text-txt-muted",
                i === hi && "bg-accent-soft",
              )}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(it)
              }}
            >
              {renderItem(it)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
