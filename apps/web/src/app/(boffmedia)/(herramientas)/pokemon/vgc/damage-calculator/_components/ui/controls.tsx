"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Shared compact input chassis.
export const INPUT_CLASS = cn(
  "w-full font-body text-[13px]/[1.3] text-txt",
  "bg-base [[data-theme=light]_&]:bg-panel-2 border border-solid border-line-2 px-[10px] py-[7px]",
  "cut-tag [--cut-tag:7px]",
  "transition-[border-color] duration-[140ms] outline-none focus:border-accent",
  "placeholder:text-txt-dim",
)

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
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function Input({ className, error, type, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(INPUT_CLASS, type === "number" && "font-mono text-[12px]", error && "border-bad", className)}
      {...props}
    />
  )
})

// CSS-drawn caret for the select.
const CARET: React.CSSProperties = {
  appearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 14px) 55%, calc(100% - 10px) 55%",
  backgroundSize: "4px 4px",
  backgroundRepeat: "no-repeat",
}

export interface SelectProps {
  value: string
  options: (string | { value: string; label: string })[]
  onChange: (value: string) => void
  ariaLabel?: string
  className?: string
}

export function Select({ value, options, onChange, ariaLabel, className }: SelectProps) {
  return (
    <select
      className={cn(INPUT_CLASS, "cursor-pointer pr-[26px]", className)}
      style={CARET}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => {
        const v = typeof o === "object" ? o.value : o
        const l = typeof o === "object" ? o.label : o
        return (
          <option key={v} value={v}>
            {l}
          </option>
        )
      })}
    </select>
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
        "cut-tag [--cut-tag:6px] grid h-full min-h-[32px] place-items-center border border-solid font-mono text-[11px]/none font-bold",
        "transition-[color,border-color,background] duration-[140ms]",
        on ? "border-warn bg-warn-soft text-warn" : "border-line-2 bg-base text-txt-dim hover:text-warn",
      )}
    >
      C
    </button>
  )
}
