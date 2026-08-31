"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"

// Mewgenics-specific controls: search, select, chip filter group, and empty state.
// Paper-textured, wobbly borders, hard shadows, hand fonts. Prefix mew-.

interface MewSearchProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  clearLabel?: string
  className?: string
}

export const MewSearch = React.forwardRef<HTMLInputElement, MewSearchProps>(
  ({ className, placeholder, label, clearLabel, value, onChange }, ref) => (
    <div className="relative w-full">
      {label && <label htmlFor="mew-search-input" className="sr-only">{label}</label>}
      <input
        ref={ref}
        id="mew-search-input"
        type="search"
        placeholder={placeholder}
        aria-label={label}
        value={value || ""}
        className={cn(
          "w-full border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3.5 py-2.5 text-[13px]/[1.5] font-medium text-[color:var(--mwp-ink)] placeholder-[color:var(--mwp-ink-soft)] [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)] transition-[box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          className
        )}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {(value as string)?.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (ref && "current" in ref) {
              const input = ref.current as HTMLInputElement | null
              if (input) {
                input.value = ""
                onChange?.("")
              }
            }
          }}
          aria-label={clearLabel || "Clear search"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center text-[color:var(--mwp-ink-soft)] transition-colors hover:text-[color:var(--mwp-ink)] active:translate-y-1/2"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  )
)
MewSearch.displayName = "MewSearch"

export function MewSelect({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  ariaLabel?: string
  className?: string
}) {
  return (
    <div className="relative inline-block w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "appearance-none border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-3.5 py-2.5 pr-8 text-[13px]/[1.5] font-medium text-[color:var(--mwp-ink)] [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)] transition-[box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed w-full",
          className
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--mwp-ink)]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M4 6l4 4 4-4z" />
      </svg>
    </div>
  )
}

export function MewChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = options.findIndex((opt) => opt.value === value)
    let nextIndex = currentIndex

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      nextIndex = (currentIndex + 1) % options.length
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      nextIndex = (currentIndex - 1 + options.length) % options.length
    } else if (e.key === "Home") {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === "End") {
      e.preventDefault()
      nextIndex = options.length - 1
    }

    if (nextIndex !== currentIndex) {
      onChange(options[nextIndex].value)
      const buttons = containerRef.current?.querySelectorAll("button[role='radio']")
      if (buttons?.[nextIndex]) {
        (buttons[nextIndex] as HTMLButtonElement).focus()
      }
    }
  }

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-[11.5px]/none uppercase tracking-[0.06em] font-bold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)] mb-1.5">
        {label}
      </legend>
      <div ref={containerRef} role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt, idx) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            tabIndex={value === opt.value ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "inline-flex items-center px-3 py-1.5 border-2 border-solid [border-radius:var(--wob-sm)] text-[12px]/none font-bold font-[family:var(--mwf-hand)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0 active:translate-y-0.5 active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)]",
              value === opt.value
                ? "border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)] [transform:rotate(-1deg)]"
                : "border-dashed border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink-soft)] hover:text-[color:var(--mwp-cream)]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function MewEmpty({
  icon = "search",
  title,
  lead,
  action,
}: {
  icon?: string
  title: string
  lead: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4">
      <div className="grid h-16 w-16 place-items-center border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-paper-2)] text-[color:var(--mwp-ink-soft)] [border-radius:var(--wob-b)]">
        <Icon name={icon as any} size={28} />
      </div>
      <h3 className="text-center text-[17px]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)]">
        {title}
      </h3>
      <p className="text-center text-[13px]/[1.5] font-medium text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] max-w-xs">
        {lead}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-4 py-2 text-[12px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_3px_0_var(--mwp-shadow-sm)] transition-all hover:translate-y-[-2px] hover:[box-shadow:0_5px_0_var(--mwp-shadow-sm)] active:translate-y-1 active:[box-shadow:0_1px_0_var(--mwp-shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
