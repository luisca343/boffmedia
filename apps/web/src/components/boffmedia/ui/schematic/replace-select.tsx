"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { SchIcon } from "./sch-icon"
import { AssetThumb } from "./asset-thumb"
import type { ThumbRenderer } from "./lib"

export interface ReplaceSelectProps {
  value?: string
  placeholder?: string
  options: string[]
  onChange: (value: string) => void
  renderThumb?: ThumbRenderer
  /** Fill the available width instead of the fixed trigger width (grid cards). */
  fluid?: boolean
}

interface PopPos {
  left: number
  width: number
  top?: number
  bottom?: number
}

// Searchable block combobox (thumb + id). The popover is position:fixed so it
// escapes the diff list's overflow; coordinates are measured off the trigger.
export function ReplaceSelect({ value, placeholder, options, onChange, renderThumb, fluid }: ReplaceSelectProps) {
  const t = useTranslations("games.minecraft.schematicCompat")
  const thumb = (id: string, size: number) => renderThumb?.(id, size) ?? <AssetThumb id={id} size={size} />
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [pos, setPos] = useState<PopPos | null>(null)
  const trigRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? options.filter((o) => o.toLowerCase().includes(s)) : options
  }, [q, options])

  function place() {
    const el = trigRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // Wide enough for the 3-column thumbnail grid, but never past the viewport.
    const w = Math.min(Math.max(r.width, 312), window.innerWidth - 16)
    const openUp = window.innerHeight - r.bottom < 280
    setPos({
      left: Math.min(r.left, window.innerWidth - w - 8),
      width: w,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
    })
  }

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    place()
    setQ("")
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (trigRef.current && !trigRef.current.contains(t) && !t.closest(".mp-cmb__pop")) setOpen(false)
    }
    // Close when the page/list behind the popover scrolls (the fixed popover would
    // detach from its trigger) — but NOT when the popover's own option list scrolls.
    const onScroll = (e: Event) => {
      const t = e.target as Node
      if (t instanceof Element && t.closest(".mp-cmb__pop")) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", close)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  return (
    <div
      className={cn("relative", fluid ? "min-w-0 flex-1" : "w-[9.75rem] shrink-0")}
      ref={trigRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "w-full h-[1.85rem] flex items-center gap-[0.35rem] px-[0.4rem] rounded-[6px]",
          "bg-layer-2 border cursor-pointer transition-[border-color] duration-[var(--dur)] ease-[var(--ease)]",
          open
            ? "border-[var(--accent)] shadow-[0_0_0_2px_var(--accent-soft)]"
            : "border-edge-strong hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border-strong))]",
        )}
      >
        {value ? thumb(value, 22) : null}
        <span
          className={cn(
            "flex-1 min-w-0 font-mono text-[11px] text-left truncate",
            value ? "text-ink" : "text-ink-dim",
          )}
        >
          {value || placeholder}
        </span>
        <SchIcon
          name="chevron"
          size={13}
          className="text-ink-dim shrink-0 transition-transform duration-[0.18s] ease-[var(--ease)]"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && pos ? (
        <div
          className={cn(
            "mp-cmb__pop fixed z-[70] flex flex-col max-h-[280px] overflow-hidden",
            "rounded-[var(--radius)] border border-edge-strong",
            "bg-[color-mix(in_srgb,var(--layer-1)_94%,transparent)] backdrop-blur-[18px]",
            "shadow-[0_20px_46px_-18px_var(--shadow-color)] animate-[dd-in_0.14s_var(--ease)]",
          )}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-[0.4rem] py-[0.45rem] px-[0.6rem] border-b border-edge text-ink-dim shrink-0">
            <SchIcon name="search" size={14} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("diff.searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-ink font-body text-[12px] placeholder:text-ink-dim"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="p-[0.7rem] text-center text-ink-dim text-[11px]">{t("diff.noResults")}</div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-1.5">
                {filtered.map((o) => {
                  const name = o.includes(":") ? o.slice(o.indexOf(":") + 1) : o
                  return (
                    <button
                      key={o}
                      type="button"
                      title={o}
                      onClick={() => {
                        onChange(o)
                        setOpen(false)
                      }}
                      className={cn(
                        "relative flex flex-col items-center gap-1 py-2 px-1 rounded-[var(--radius)] border",
                        "cursor-pointer font-mono text-[10px] leading-tight text-center",
                        "transition-[background,border-color,color] duration-[var(--dur)] ease-[var(--ease)]",
                        o === value
                          ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[var(--accent-soft)] text-[color:var(--accent-bright)]"
                          : "border-transparent text-ink-muted hover:bg-layer-2 hover:text-ink",
                      )}
                    >
                      {thumb(o, 42)}
                      <span className="w-full truncate">{name}</span>
                      {o === value ? (
                        <SchIcon
                          name="check"
                          size={12}
                          stroke={2.6}
                          className="absolute top-1 right-1 text-[color:var(--accent-bright)]"
                        />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
              className="shrink-0 p-[0.4rem] border-0 border-t border-edge bg-transparent text-ink-dim text-[10px] cursor-pointer transition-colors hover:text-ink-muted"
            >
              {t("diff.clearSelection")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
