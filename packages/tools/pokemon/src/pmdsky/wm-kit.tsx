"use client"

import * as React from "react"
import { cn } from "@boffmedia/ui/cn"
import { Icon, CodeBlock, INPUT_BASE, type IconName } from "@boffmedia/ui"

// ── Searchable combo: input + filtered dropdown, ↑/↓/Enter/Esc, and a
//    right-aligned `.tail` slot in options ───────────────────────────────────
export interface WmComboProps<T> {
  value: string
  getItems: (query: string) => T[]
  onPick: (item: T) => void
  renderItem: (item: T) => React.ReactNode
  itemKey: (item: T) => string
  placeholder?: string
  ariaLabel?: string
  emptyLabel?: string
}

export function WmCombo<T>({
  value,
  getItems,
  onPick,
  renderItem,
  itemKey,
  placeholder = "…",
  ariaLabel,
  emptyLabel = "—",
}: WmComboProps<T>) {
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [hi, setHi] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQ("")
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [open])

  const items = React.useMemo(
    () => (open ? getItems(q.trim().toLowerCase()).slice(0, 60) : []),
    [q, open, getItems],
  )
  React.useEffect(() => setHi(0), [q, open])

  const pick = (it: T) => {
    onPick(it)
    setOpen(false)
    setQ("")
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
      setQ("")
    }
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <input
        className={cn(INPUT_BASE, "pr-9")}
        value={open ? q : value}
        placeholder={value || placeholder}
        role="combobox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQ("")
        }}
        onKeyDown={onKey}
      />
      <Icon
        name="chevronDown"
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-txt-dim"
      />
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%_+_4px)] z-50 max-h-[18.75rem] w-full overflow-y-auto border border-solid border-line-2 bg-panel shadow-[var(--shadow)]"
        >
          {items.length === 0 ? (
            <div className="px-[0.875rem] py-3 font-mono text-[0.75rem] leading-[1.4] text-txt-dim">{emptyLabel}</div>
          ) : (
            items.map((it, i) => (
              <button
                key={itemKey(it)}
                type="button"
                role="option"
                aria-selected={i === hi}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(it)
                }}
                className={cn(
                  "flex w-full items-center gap-[0.625rem] px-3 py-2 text-left font-body text-[0.8125rem] leading-[1.2] text-txt",
                  "[&_.tail]:ml-auto [&_.tail]:inline-flex [&_.tail]:items-center [&_.tail]:gap-1 [&_.tail]:font-mono [&_.tail]:text-[0.6875rem] [&_.tail]:leading-none [&_.tail]:text-txt-muted",
                  i === hi && "bg-accent-soft",
                )}
              >
                {renderItem(it)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Difficulty stars ─────────────────────────────────────────────────────────
export function WmStars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-[2px]" aria-label={`${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} className={i <= n ? "text-warn" : "text-line-2"} />
      ))}
    </span>
  )
}

// ── Numbered section card ────────────────────────────────────────────────────
export function WmSection({
  n,
  icon,
  title,
  aside,
  children,
}: {
  n: string
  icon: IconName
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border border-solid border-line bg-panel">
      <header className="flex items-center gap-[0.6875rem] border-b border-solid border-line px-4 py-[0.8125rem]">
        <span className="cut cut-edge-slant [--cut-line:var(--accent-line)] [--cut:3px] border border-solid border-accent-line bg-accent-soft px-[0.4375rem] py-[0.3125rem] font-mono text-[0.6875rem] font-bold leading-none tracking-[0.1em] text-accent">
          {n}
        </span>
        <span className="grid place-items-center text-txt-muted">
          <Icon name={icon} size={15} />
        </span>
        <h3 className="font-display text-[0.9375rem] font-bold not-italic uppercase leading-none tracking-[0.04em] text-txt">
          {title}
        </h3>
        <span className="flex-1" aria-hidden="true" />
        {aside}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

// ── Pokémon picker: framed real PMD portrait + searchable combo / lock note ──
export interface PokeOpt {
  value: string
  label: string
}

export function WmPokePicker({
  label,
  valueLabel,
  sprite,
  options,
  onPick,
  disabled,
  disabledReason,
  searchPlaceholder,
}: {
  label: React.ReactNode
  valueLabel: string
  sprite?: string
  options: PokeOpt[]
  onPick: (value: string) => void
  disabled?: boolean
  disabledReason?: string
  searchPlaceholder?: string
}) {
  const getItems = (q: string) => (q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options)
  return (
    <div className="flex min-w-0 items-start gap-[0.6875rem]">
      <span className="grid h-[3.25rem] w-[3.25rem] flex-none place-items-center border border-solid border-line bg-base" aria-hidden="true">
        {sprite ? (
          <img
            src={sprite}
            alt=""
            className="h-[2.75rem] w-[2.75rem] object-contain [image-rendering:pixelated]"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.visibility = "hidden"
            }}
          />
        ) : (
          <Icon name="user" size={18} className="text-txt-dim" />
        )}
      </span>
      <div className="grid min-w-0 flex-1 gap-2">
        <label className="font-mono text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-muted">
          {label}
        </label>
        {disabled ? (
          <div
            className="flex items-center gap-[0.4375rem] border border-dashed border-line-2 bg-base-2 px-3 py-[0.6875rem] font-body text-[0.75rem] leading-[1.3] text-txt-dim"
            title={disabledReason}
          >
            <Icon name="lock" size={13} className="flex-none" />
            {disabledReason}
          </div>
        ) : (
          <WmCombo
            value={valueLabel}
            placeholder={searchPlaceholder}
            ariaLabel={typeof label === "string" ? label : undefined}
            getItems={getItems}
            itemKey={(it) => it.value}
            onPick={(it) => onPick(it.value)}
            renderItem={(it) => <span>{it.label}</span>}
          />
        )}
      </div>
    </div>
  )
}

// ── Result ticket (empty / loading / ready) ──────────────────────────────────
export function WmTicket({
  status,
  codeLines,
  codeText,
  region,
  label,
  emptyTitle,
  emptyText,
  loadingTitle,
  loadingText,
  codeLabel,
  readyHint,
}: {
  status: "empty" | "loading" | "ready"
  codeLines: string[]
  codeText: string
  region: string
  label: string
  emptyTitle: string
  emptyText: React.ReactNode
  loadingTitle: string
  loadingText: string
  codeLabel: string
  readyHint: string
}) {
  return (
    <div className="cut-corner cut-corner-edge [--cut-line:var(--line-2)] [--cut-lg:16px] relative border border-solid border-line-2 bg-[color-mix(in_srgb,var(--accent)_5%,var(--panel))]">
      <div className="h-[3px] bg-[linear-gradient(90deg,var(--accent),var(--accent-bright),transparent)]" aria-hidden="true" />
      <div className="flex items-center justify-between px-4 pt-[0.8125rem]">
        <span className="inline-flex items-center gap-2 font-display text-[0.75rem] font-bold uppercase leading-none tracking-[0.08em] text-txt">
          <Icon name="mail" size={15} /> {label}
        </span>
        <span className="border border-solid border-line-2 px-2 py-[0.3125rem] font-mono text-[0.625rem] font-semibold leading-none tracking-[0.1em] text-txt-muted">
          {region}
        </span>
      </div>

      {status === "ready" ? (
        <div className="px-4 pb-4 pt-[0.875rem]">
          <CodeBlock lines={codeLines} tone="accent" copyText={codeText} label={`${codeLabel} · ${region}`} scan />
          <p className="mt-[0.625rem] flex items-center gap-[0.375rem] font-mono text-[0.6875rem] leading-[1.4] text-txt-dim">
            <Icon name="info" size={12} />
            {readyHint}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 pb-[2.125rem] pt-[1.875rem] text-center">
          <span
            className={cn(
              "cut cut-edge-slant [--cut-line:var(--accent-line)] grid h-[3.75rem] w-[3.75rem] place-items-center border border-solid border-accent-line bg-accent-soft text-accent",
              status === "loading" && "motion-safe:animate-[bm-spin_0.9s_linear_infinite]",
            )}
          >
            <Icon name={status === "loading" ? "refresh" : "mail"} size={30} />
          </span>
          <b className="font-display text-[1rem] font-extrabold not-italic uppercase leading-none tracking-[0.03em] text-txt">
            {status === "loading" ? loadingTitle : emptyTitle}
          </b>
          <p className="m-0 max-w-[30ch] font-body text-[0.8125rem] leading-[1.5] text-txt-muted">
            {status === "loading" ? loadingText : emptyText}
          </p>
        </div>
      )}
    </div>
  )
}
