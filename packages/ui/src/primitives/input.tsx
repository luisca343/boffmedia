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

/** The compact scale, shared with Select: the 32px box Button and IconButton
 *  use for `sm`, so a toolbar of mixed controls sits on one line. Declared once
 *  here rather than as `h-8 py-0 …` overrides at every call site — those only
 *  worked by out-arguing INPUT_BASE through tailwind-merge. */
export const INPUT_SM = "h-8 py-0 px-2.5 text-[12.5px]"

export type InputSize = "sm" | "md"

/** The native `size` attribute (a character width nobody set) gives way to the
 *  control scale, matching Button. */
export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, size, ...props }, ref) {
  return <input ref={ref} className={cn(INPUT_BASE, size === "sm" && INPUT_SM, className)} {...props} />
})

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(INPUT_BASE, "min-h-[90px] resize-y", className)} {...props} />
})
