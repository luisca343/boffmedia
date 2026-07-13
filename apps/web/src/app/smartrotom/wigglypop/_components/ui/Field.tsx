"use client"

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/**
 * The shared control chrome: white fill, 1.5px plum border, and — the part that
 * matters — a **4px accent-soft halo** on focus rather than a hard ring. The soft
 * halo is what keeps the form from feeling like an admin panel dropped into a candy
 * shop. Every control below shares it, so they must never diverge.
 */
const CONTROL =
  "w-full rounded-wp-sm border-wp border-wp-line/24 bg-white px-[13px] py-2.5 font-wp text-[13.5px] font-bold text-wp-fg " +
  "shadow-[inset_0_1px_2px_rgba(223,63,137,.05)] outline-none transition-[border-color,box-shadow,background-color] duration-150 " +
  "placeholder:font-bold placeholder:text-wp-fg-subtle " +
  "hover:border-wp-line/46 focus:border-wp-accent focus:shadow-[0_0_0_4px_rgb(var(--wp-accent)/.13)] " +
  "disabled:opacity-45"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />
}

/** A ₽ amount input. The teal-free pink ₽ prefix marks it as *you setting a price*,
 *  as opposed to `<Price>`, which is a price being quoted *to* you. */
export function PriceInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 font-wp font-extrabold text-wp-accent">
        ₽
      </span>
      <input
        type="number"
        className={cn(CONTROL, "wp-num pl-7", className)}
        {...props}
      />
    </div>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "min-h-16 resize-y leading-relaxed", className)} {...props} />
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(CONTROL, "cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <Icon
        name="chevD"
        size={14}
        stroke={2.4}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-wp-fg-subtle"
      />
    </div>
  )
}

/**
 * The pill toggle. The knob slides on the bouncy ease, so it lands with a tiny
 * overshoot — the same motion signature as the buttons.
 */
export function Toggle({
  on,
  onChange,
  label,
  className,
}: {
  on: boolean
  onChange: (next: boolean) => void
  /** Required: an unlabelled switch is unusable to a screen reader. */
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[23px] w-10 flex-none rounded-wp-pill transition-colors duration-200",
        on ? "bg-wp-accent" : "bg-[#f0cede]",
        className,
      )}
    >
      <i
        className={cn(
          "absolute top-[2.5px] h-[18px] w-[18px] rounded-wp-pill bg-white shadow-[0_2px_4px_rgba(0,0,0,.2)]",
          "transition-[left] duration-200 ease-wp motion-reduce:transition-none",
          on ? "left-[19px]" : "left-[2.5px]",
        )}
      />
    </button>
  )
}

/** The square checkbox in the filter rail. */
export function Checkbox({
  on,
  onChange,
  children,
  className,
}: {
  on: boolean
  onChange: (next: boolean) => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-wp text-[13.5px] font-bold",
        "transition-colors duration-100 hover:bg-wp-panel-2",
        on ? "text-wp-fg" : "text-wp-fg-muted",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-[19px] w-[19px] flex-none items-center justify-center rounded-[7px] border-2 text-white transition-colors duration-100",
          on ? "border-wp-accent bg-wp-accent" : "border-wp-line/46",
        )}
      >
        {on && <Icon name="check" size={12} stroke={3} />}
      </span>
      {children}
    </button>
  )
}

/**
 * The range slider. Native `input[type=range]` cannot be styled by Tailwind
 * utilities (the thumb lives behind a vendor pseudo-element), so this is the one
 * place in the app that reaches for inline `<style>` — the sanctioned escape hatch
 * for what Tailwind genuinely cannot express (§6).
 */
export function Range({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <>
      <input type="range" className={cn("wp-range h-1.5 w-full", className)} {...props} />
      <style jsx global>{`
        .wp-range {
          -webkit-appearance: none;
          appearance: none;
          border-radius: 999px;
          background: #fadbe9;
          outline: none;
        }
        .wp-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: rgb(var(--wp-accent));
          border: 3px solid #fff;
          box-shadow: 0 3px 8px rgba(223, 63, 137, 0.5);
          cursor: pointer;
        }
        .wp-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgb(var(--wp-accent));
          border: 3px solid #fff;
          box-shadow: 0 3px 8px rgba(223, 63, 137, 0.5);
          cursor: pointer;
        }
      `}</style>
    </>
  )
}
