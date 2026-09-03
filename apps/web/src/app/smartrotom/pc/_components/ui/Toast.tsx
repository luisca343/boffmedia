"use client"

import { toast, useToasts, type ToastKind } from "@/components/smartrotom/behavior/toast"

export { toast }

/** A literal class per tone — an interpolated `bg-pc-${type}` would never compile.
 * `warn` is unused in practice (the app only ever fires info/success/error). */
const DOT: Record<ToastKind, string> = {
  success: "bg-pc-green shadow-[0_0_8px_rgb(var(--pc-green))]",
  error: "bg-pc-rose shadow-[0_0_8px_rgb(var(--pc-rose))]",
  warn: "bg-pc-rose shadow-[0_0_8px_rgb(var(--pc-rose))]",
  info: "bg-pc-accent shadow-[0_0_8px_rgb(var(--pc-accent))]",
}

export function ToastHost() {
  const toasts = useToasts()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-[200] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pc-glass flex animate-pc-pop items-center gap-2.5 rounded-pc-pill border-pc-line-strong py-2.5 pl-[0.8125rem] pr-4 font-pc text-[0.84375rem] font-semibold text-pc-fg shadow-[0_18px_40px_-18px_rgb(0_0_0_/_.7)] motion-reduce:animate-none"
        >
          <span className={`h-2 w-2 flex-none rounded-pc-pill ${DOT[t.kind]}`} />
          {t.msg}
        </div>
      ))}
    </div>
  )
}
