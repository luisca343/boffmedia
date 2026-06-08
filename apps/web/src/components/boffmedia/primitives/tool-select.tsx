"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface SelectItem {
  value?: string
  label?: string
  header?: string
}

interface ToolSelectProps {
  value?: string
  items: SelectItem[]
  onSelect?: (value: string) => void
  width?: string
  align?: "left" | "right"
  icon?: string
  placeholder?: string
  minWidth?: string
}

export function ToolSelect({
  value, items, onSelect, width = "220px", icon, placeholder = "Seleccionar", minWidth, align = "left",
}: ToolSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
  }, [open])

  const flat = items.filter((it): it is SelectItem & { value: string } => it != null && it.value != null)
  const current = flat.find((it) => String(it.value) === String(value))

  const handleSelect = (v: string) => {
    onSelect?.(v)
    setOpen(false)
  }

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-[0.45rem] whitespace-nowrap shrink-0",
          "px-[0.7rem] py-[0.46rem]",
          "rounded-[var(--radius)] [border-width:var(--hairline)] border-solid [border-color:var(--border-strong)]",
          "bg-[var(--surface-2)] text-sm font-medium text-[var(--text)]",
          "hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border-strong))]",
          "transition-[border-color,background] duration-[var(--dur)] ease-[var(--ease)]",
        )}
        style={minWidth ? { minWidth } : { width }}
      >
        {icon && <Icon name={icon} size={13} className="shrink-0 text-[var(--text-dim)]" />}
        <span className="flex-1 text-left overflow-hidden text-ellipsis">{current ? current.label : placeholder}</span>
        <Icon name="chevron" size={14} className={cn("shrink-0 text-[var(--text-dim)] ml-auto transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+6px)] z-[130] min-w-[180px] max-h-[320px] overflow-y-auto",
            "bg-[var(--surface)] border border-[var(--border-strong)]",
            "rounded-[var(--radius-lg)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)]",
            "py-1",
          )}
          style={align === "right" ? { right: 0 } : { left: 0 }}
        >
          {items.map((it, i) => {
            if (it.header) {
              return (
                <div
                  key={`header-${i}`}
                  className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)]"
                >
                  {it.header}
                </div>
              )
            }
            if (!it.value) return null
            const isActive = String(it.value) === String(value)
            return (
              <button
                key={it.value}
                type="button"
                onClick={() => handleSelect(it.value!)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent-bright)] font-semibold"
                    : "text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--surface-3)_55%,transparent)]",
                )}
              >
                {it.label}
              </button>
            )
          })}
        </div>
      )}
    </span>
  )
}
