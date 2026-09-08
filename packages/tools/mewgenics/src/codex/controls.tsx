"use client"

import * as React from "react"
import { cn, Icon, type IconName } from "@boffmedia/ui"
import { MewButton } from "../mew-kit"

// Mewgenics-specific controls: search, select, chip filter group, and empty state.
// Paper-textured, wobbly borders, hard shadows, hand fonts. Prefix mew-.

interface MewSearchProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  clearLabel: string
  className?: string
}

export const MewSearch = React.forwardRef<HTMLInputElement, MewSearchProps>(
  ({ className, placeholder, label, clearLabel, value = "", onChange }, ref) => {
    const inputId = React.useId()

    return (
      <div className="mew-search relative w-full">
        {label && <label htmlFor={inputId} className="sr-only">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          type="search"
          placeholder={placeholder}
          aria-label={label}
          value={value}
          className={cn(
            "mew-input pr-10 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            className,
          )}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange?.("")}
            aria-label={clearLabel}
            className="mew-search__clear absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center text-[color:var(--mwp-ink-soft)] transition-colors hover:text-[color:var(--mwp-ink)] active:translate-y-1/2"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
    )
  },
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
    <div className="mew-select-wrap relative inline-block w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "mew-select disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--mwp-ink)]"
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
      <legend className="text-[0.71875rem]/none uppercase tracking-[0.06em] font-bold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)] mb-1.5">
        {label}
      </legend>
      <div ref={containerRef} role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            tabIndex={value === opt.value ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "mew-filter-chip",
              value === opt.value && "mew-filter-chip--selected",
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
  icon?: IconName
  title: string
  lead: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4">
      <div className="grid h-16 w-16 place-items-center border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-paper-2)] text-[color:var(--mwp-ink-soft)] [border-radius:var(--wob-b)]">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="text-center text-[1.0625rem]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)]">
        {title}
      </h3>
      <p className="text-center text-[0.8125rem]/[1.5] font-medium text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] max-w-xs">
        {lead}
      </p>
      {action && (
        <MewButton
          onClick={action.onClick}
          className="mew-button--compact mt-2"
        >
          {action.label}
        </MewButton>
      )}
    </div>
  )
}
