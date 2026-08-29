"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input as KitInput, Select as KitSelect, type SelectOption, type InputProps as KitInputProps } from "@boffmedia/ui"

// labelled field wrapper.
export function Field({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 gap-[5px]", className)}>
      <span className="font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{label}</span>
      {children}
    </div>
  )
}

export const Input = React.forwardRef<
  HTMLInputElement,
  KitInputProps & { error?: boolean }
>(function Input({ className, error, ...props }, ref) {
  return (
    <KitInput
      ref={ref}
      className={cn(props.type === "number" && "font-mono", error && "border-bad", className)}
      {...props}
    />
  )
})

export interface SelectProps {
  value: string
  options: (string | { value: string; label: string })[]
  onChange: (value: string) => void
  ariaLabel?: string
  className?: string
}

export function Select({ value, options, onChange, ariaLabel, className }: SelectProps) {
  const selectOptions: SelectOption[] = options.map((o) => {
    const v = typeof o === "object" ? o.value : o
    const l = typeof o === "object" ? o.label : o
    return { value: v, label: l }
  })

  return (
    <KitSelect
      value={value}
      options={selectOptions}
      onChange={onChange}
      ariaLabel={ariaLabel}
      className={className}
    />
  )
}

// crit toggle for a move row.
export function CritToggle({ on, onClick, title }: { on: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:6px] grid h-full min-h-[32px] place-items-center border border-solid font-mono text-[11px]/none font-bold",
        "transition-[color,border-color,background] duration-[140ms]",
        on ? "border-warn [--cut-line:var(--warn)] bg-warn-soft text-warn" : "border-line-2 [--cut-line:var(--line-2)] bg-base text-txt-dim hover:text-warn",
      )}
    >
      C
    </button>
  )
}
