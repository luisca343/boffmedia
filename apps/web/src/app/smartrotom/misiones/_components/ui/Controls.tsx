"use client"

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

type Variant = "default" | "primary" | "ghost" | "dark"

const VARIANT: Record<Variant, string> = {
  // Pressed out of the same paper the quests are written on.
  default:
    "bg-gradient-to-b from-ms-paper-1 to-ms-paper-3 text-ms-ink-1 border-ms-ink-3 shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(0,0,0,.2)]",
  primary: "bg-gradient-to-b from-ms-gold-2 to-ms-gold-3 text-[#1e120a] border-ms-gold-4 shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_2px_0_rgba(0,0,0,.2)]",
  ghost: "bg-transparent border-transparent text-ms-ink-2 hover:bg-ms-ink-1/10 hover:text-ms-ink-1",
  // Burnt wood — the only button that reads on the rail or the desk.
  dark: "bg-gradient-to-b from-[#2a1810] to-[#18100a] text-ms-gold-1 border-[#6a4a28] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_2px_0_rgba(0,0,0,.3)]",
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; sm?: boolean }>(
  function Button({ variant = "default", sm = false, className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center gap-2 rounded-[3px] border-[1.5px] font-ms-uppercase uppercase tracking-[.10em] transition-[transform,filter] duration-100",
          "hover:-translate-y-px hover:brightness-110 active:translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
          "disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          sm ? "px-[11px] py-1.5 text-[11px]" : "px-4 py-2.5 text-[13px]",
          VARIANT[variant],
          className,
        )}
        {...props}
      />
    )
  },
)

/** Parchment chip — the board's filters. */
export const Chip = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }>(
  function Chip({ active = false, className, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-[5px] font-ms-uppercase text-[11px] uppercase tracking-[.12em] transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2",
          active
            ? "border-ms-gold-4 bg-gradient-to-b from-ms-gold-2 to-ms-gold-3 text-[#1e120a] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_0_12px_-3px_rgb(var(--ms-gold-2))]"
            : "border-ms-ink-3 bg-gradient-to-b from-ms-paper-2 to-ms-paper-3 text-ms-ink-2 shadow-[inset_0_1px_0_rgba(255,255,255,.35)] hover:brightness-105",
          className,
        )}
        {...props}
      />
    )
  },
)

/** Ink-well input — pressed into the paper, not floating over it. */
export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Field(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-sm border border-ms-ink-3 bg-ms-paper-2 bg-gradient-to-b from-white/30 to-transparent px-3.5 py-2.5",
        "font-ms text-sm text-ms-ink-1 shadow-[inset_0_2px_4px_rgba(60,40,20,.15)] outline-none",
        "placeholder:italic placeholder:text-ms-ink-3 focus-visible:ring-2 focus-visible:ring-ms-gold-2",
        className,
      )}
      {...props}
    />
  )
})

/** The same field, with the lens tucked inside it. */
export function SearchField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Field type="search" className="pl-9" {...props} />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ms-ink-3">
        <Icon.Search size={14} />
      </span>
    </div>
  )
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "rounded-sm border border-ms-ink-3 bg-ms-paper-2 px-3 py-2.5 font-ms-uppercase text-[11px] uppercase tracking-[.10em] text-ms-ink-1",
        "shadow-[inset_0_2px_4px_rgba(60,40,20,.15)] outline-none focus-visible:ring-2 focus-visible:ring-ms-gold-2",
        className,
      )}
      {...props}
    />
  )
})
