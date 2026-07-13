"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"
import { ThemedLayer } from "./ThemedLayer"

type Tone = "info" | "success" | "error"

interface ToastItem {
  id: number
  tone: Tone
  icon: IconName
  message: React.ReactNode
}

const DURATION = 2600

// A module-level emitter rather than a context: toasts are fired from mutation
// callbacks and event handlers all over the app, and threading a hook through every one
// of them buys nothing. Same shape as Notas' `toast()`.
let nextId = 0
const listeners = new Set<(items: ToastItem[]) => void>()
let items: ToastItem[] = []

function emit() {
  for (const l of listeners) l(items)
}

function push(tone: Tone, icon: IconName, message: React.ReactNode) {
  const id = ++nextId
  items = [...items, { id, tone, icon, message }]
  emit()
  setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, DURATION)
}

export const toast = {
  info: (message: React.ReactNode, icon: IconName = "spark") => push("info", icon, message),
  success: (message: React.ReactNode, icon: IconName = "check") => push("success", icon, message),
  error: (message: React.ReactNode, icon: IconName = "wallet") => push("error", icon, message),
}

// `info` wears its icon bare in the accent; the two outcome tones put it in a filled
// disc, so a completed trip or a refused payment reads at a glance.
const TONES: Record<Tone, { wrap: string; badge?: string }> = {
  info: { wrap: "border-tx-line-2 text-tx-accent" },
  success: { wrap: "border-tx-ok", badge: "bg-tx-ok text-[#042a1c]" },
  error: { wrap: "border-tx-no", badge: "bg-tx-no text-white" },
}

/** Mount once, at the app root. Portaled, so it carries its own themed layer. */
export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>(items)

  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])

  if (typeof document === "undefined" || list.length === 0) return null

  return createPortal(
    <ThemedLayer>
      <div className="fixed left-1/2 top-[74px] z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
        {list.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-center gap-2.5 rounded-tx-pill py-2.5 pl-3 pr-5",
              "bg-tx-surface-solid border border-solid shadow-tx-2",
              "text-[13.5px] font-bold text-tx-txt",
              "animate-tx-toast-in motion-reduce:animate-none",
              TONES[t.tone].wrap,
            )}
          >
            {TONES[t.tone].badge ? (
              <span className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full", TONES[t.tone].badge)}>
                <Icon name={t.icon} size={18} stroke={2.6} />
              </span>
            ) : (
              <Icon name={t.icon} size={15} stroke={2.2} />
            )}
            <span className="text-tx-txt">{t.message}</span>
          </div>
        ))}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
