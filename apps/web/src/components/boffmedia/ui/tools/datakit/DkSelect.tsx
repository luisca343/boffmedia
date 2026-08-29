import * as React from "react"
import { cn } from "@/lib/utils"
import { Select, type SelectOption } from "@boffmedia/ui"

export interface DkSelectOption {
  value: string | number
  label: string
}

export interface DkSelectProps {
  value: string | number
  options: (DkSelectOption | string)[]
  onChange: (value: string) => void
  minWidth?: string
  ariaLabel?: string
  className?: string
}

export function DkSelect({ value, options, onChange, minWidth, ariaLabel, className }: DkSelectProps) {
  const selectOptions: SelectOption[] = options.map((o) => {
    const v = typeof o === "object" ? o.value : o
    const l = typeof o === "object" ? o.label : o
    return { value: String(v), label: String(l) }
  })

  return (
    <div style={{ minWidth }}>
      <Select
        value={String(value)}
        options={selectOptions}
        onChange={onChange}
        ariaLabel={ariaLabel}
        size="sm"
        className={cn("max-w-[280px]", className)}
      />
    </div>
  )
}
