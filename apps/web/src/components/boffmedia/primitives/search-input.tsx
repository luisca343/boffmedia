"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  autoFocus?: boolean
  className?: string
}

export function SearchInput({ value, onChange, placeholder = "Buscar…", onClear, autoFocus, className }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Icon name="search" size={18} className="absolute left-3.5 text-[var(--text-dim)] pointer-events-none" />
      <input
        className={cn(
          "w-full font-body text-sm text-[var(--text)]",
          "bg-[var(--surface-2)] border border-solid border-[var(--border-strong)]",
          "rounded-[var(--btn-radius,9999px)]",
          "pl-10 pr-[2.4rem] h-[46px]",
          "transition-[border-color,box-shadow] duration-[var(--dur,0.32s)] ease-[var(--ease)]",
          "placeholder:text-[var(--text-dim)]",
          "focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]",
          "disabled:opacity-55 disabled:cursor-not-allowed",
        )}
        type="text"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          className="absolute right-2 grid place-items-center w-[26px] h-[26px] border-0 rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] cursor-pointer transition-[color,background] duration-[var(--dur,0.32s)] hover:text-[var(--text)] hover:bg-[var(--border-strong)]"
          aria-label="Limpiar"
          onClick={() => { onChange(""); onClear && onClear() }}
        >
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  )
}
