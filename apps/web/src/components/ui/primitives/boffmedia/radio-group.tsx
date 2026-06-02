"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioOption { value: string; label: string; desc?: string; disabled?: boolean }

interface RadioGroupProps {
  value?: string
  defaultValue?: string
  options: (RadioOption | string)[]
  onChange?: (value: string) => void
  name?: string
  className?: string
}

export function RadioGroup({ value, defaultValue, options, onChange, name, className }: RadioGroupProps) {
  const [v, setV] = React.useState(defaultValue)
  const cur = value !== undefined ? value : v
  const pick = (val: string) => { if (value === undefined) setV(val); onChange && onChange(val) }
  const items = options.map((o) => typeof o === "string" ? { value: o, label: o } : o)

  return (
    <div className={cn("k-radiogroup", className)} role="radiogroup">
      {items.map((o) => (
        <label key={o.value} className={cn("k-radio", cur === o.value && "k-radio--on", o.disabled && "k-radio--dis")}>
          <input type="radio" name={name} checked={cur === o.value} disabled={o.disabled} onChange={() => pick(o.value)} />
          <span className="k-radio__dot" />
          <span className="k-radio__body">
            <span className="k-radio__label">{o.label}</span>
            {o.desc && <span className="k-radio__desc">{o.desc}</span>}
          </span>
        </label>
      ))}
    </div>
  )
}
