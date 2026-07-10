"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  label?: React.ReactNode
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, defaultChecked, onChange, label, disabled, className }: CheckboxProps) {
  const [un, setUn] = React.useState(!!defaultChecked)
  const isCtrl = checked !== undefined
  const val = isCtrl ? !!checked : un
  const toggle = () => {
    if (!isCtrl) setUn(!val)
    onChange?.(!val)
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={val}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "group inline-flex items-center gap-[11px] p-0 border-0 bg-transparent text-left cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex-none grid place-items-center w-5 h-5 border border-solid transition-[background,border-color] duration-[140ms]",
          "cut-tag [--cut-tag:6px]",
          val
            ? "bg-accent border-accent"
            : "bg-base border-line-2 [.group:enabled:hover_&]:border-accent",
        )}
      >
        <Icon
          name="check"
          size={13}
          className={cn(
            "text-accent-ink transition-[opacity,transform] duration-[140ms]",
            val ? "opacity-100" : "opacity-0 scale-50",
          )}
        />
      </span>
      {label && <span className="font-body text-[14px] font-medium leading-[1.3] text-txt">{label}</span>}
    </button>
  )
}
