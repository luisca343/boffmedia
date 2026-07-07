import * as React from "react"
import { cn } from "@/lib/utils"

// Shared chassis for text inputs, selects and textareas (.sn-input / .sn-select / .sn-textarea).
export const INPUT_BASE = cn(
  "w-full font-body text-[15px] font-normal leading-[1.4] text-txt",
  "bg-base [[data-theme=light]_&]:bg-panel border border-solid border-line-2 py-[11px] px-[14px]",
  "cut-tag",
  "transition-[border-color,background] duration-[140ms] outline-none",
  "focus:border-accent placeholder:text-txt-dim",
  "disabled:opacity-[0.42] disabled:cursor-not-allowed",
)

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(INPUT_BASE, className)} {...props} />
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(INPUT_BASE, "min-h-[90px] resize-y", className)} {...props} />
}
