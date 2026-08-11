import * as React from "react"
import { cn } from "../cn"

// Shared chassis for text inputs, selects and textareas (.sn-input / .sn-select / .sn-textarea).
export const INPUT_BASE = cn(
  "w-full font-body text-[15px] font-normal leading-[1.4] text-txt",
  "bg-base [[data-theme=light]_&]:bg-panel border border-solid border-line-2 py-[11px] px-[14px]",
  "cut-tag cut-tag-edge [--cut-line:var(--line-2)]",
  "transition-[border-color,background] duration-[140ms] outline-none",
  "focus:border-accent focus:[--cut-line:var(--accent)] placeholder:text-txt-dim",
  "disabled:opacity-[0.42] disabled:cursor-not-allowed",
)

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(INPUT_BASE, className)} {...props} />
})

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(INPUT_BASE, "min-h-[90px] resize-y", className)} {...props} />
})
