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
    <div className={cn("searchinput", className)}>
      <Icon name="search" size={18} className="searchinput__icon" />
      <input className="input searchinput__field" type="text" value={value} placeholder={placeholder}
        autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} />
      {value ? (
        <button className="searchinput__clear" aria-label="Limpiar" onClick={() => { onChange(""); onClear && onClear() }}>
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  )
}
