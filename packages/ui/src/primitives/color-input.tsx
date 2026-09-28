"use client"

import * as React from "react"
import { cn } from "../cn"
import { INPUT_BASE, INPUT_SM, type InputProps } from "./input"
import { Icon } from "./icon"

export type ColorInputProps = Omit<InputProps, "type" | "value" | "defaultValue"> & {
  value?: string
  defaultValue?: string
}

function colorForeground(color: string) {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000000" : "#ffffff"
}

/** Native color picker with a full-field swatch and contrasting hex value. The transparent
 * input keeps native keyboard, form and picker behavior; Field names that input. */
export const ColorInput = React.forwardRef<HTMLInputElement, ColorInputProps>(function ColorInput({
  value, defaultValue = "#808080", onChange, className, size, ...props
}, ref) {
  const [localValue, setLocalValue] = React.useState(defaultValue)
  const chassisRef = React.useRef<HTMLDivElement>(null)
  const controlled = value !== undefined
  const color = value ?? localValue
  React.useEffect(() => {
    if (controlled) return
    const form = chassisRef.current?.querySelector("input")?.form
    const reset = (event: Event) => queueMicrotask(() => {
      if (!event.defaultPrevented) setLocalValue(defaultValue)
    })
    form?.addEventListener("reset", reset)
    return () => form?.removeEventListener("reset", reset)
  }, [controlled, defaultValue, props.form])
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true"
  return <div ref={chassisRef} className={cn(
    INPUT_BASE, "relative flex min-w-0 items-center gap-2.5",
    "focus-within:border-accent focus-within:[--cut-line:var(--accent)]",
    "[&:has(input:focus-visible)]:ring-2 [&:has(input:focus-visible)]:ring-accent",
    "[&:has(input:disabled)]:opacity-[0.42]",
    invalid && "border-bad [--cut-line:var(--bad)] focus-within:border-bad focus-within:[--cut-line:var(--bad)]",
    size === "sm" && INPUT_SM, className,
  )} style={{ backgroundColor: color, color: colorForeground(color) }}>
    <span aria-hidden="true" data-color-swatch className="pointer-events-none absolute inset-0" style={{ backgroundColor: color }} />
    <span aria-hidden="true" className="pointer-events-none relative truncate font-mono text-xs font-bold uppercase">{color}</span>
    <Icon name="palette" size={16} className="pointer-events-none relative ml-auto opacity-80" />
    <input {...props} ref={ref} type="color" {...(controlled ? { value } : { defaultValue })}
      onChange={(event) => { if (value === undefined) setLocalValue(event.target.value); onChange?.(event) }}
      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
  </div>
})
