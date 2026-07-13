"use client"

import { useEffect, useState, type ReactNode } from "react"

export type ToastKind = "success" | "info" | "warn" | "error"

export interface ToastItem {
  id: string
  /** Usually a string; a couple of hosts render a richer node (e.g. a bolded stop name). */
  msg: ReactNode
  kind: ToastKind
}

type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((l) => l([...items]))

export function dismissToast(id: string) {
  items = items.filter((i) => i.id !== id)
  emit()
}

/**
 * Module-level bus so any component can raise a toast without prop drilling
 * or context. One SmartRotom app is mounted at a time, so a single queue is
 * safe; each app renders its own skinned host with useToasts().
 */
export function toast(msg: ReactNode, kind: ToastKind = "success", durationMs = 2600) {
  const id = Math.random().toString(36).slice(2)
  items = [...items, { id, msg, kind }]
  emit()
  setTimeout(() => dismissToast(id), durationMs)
}

toast.success = (msg: ReactNode, durationMs?: number) => toast(msg, "success", durationMs)
toast.info = (msg: ReactNode, durationMs?: number) => toast(msg, "info", durationMs)
toast.warn = (msg: ReactNode, durationMs?: number) => toast(msg, "warn", durationMs)
toast.error = (msg: ReactNode, durationMs?: number) => toast(msg, "error", durationMs)

/** Live toast queue for a per-app <ToastHost> skin. */
export function useToasts(): ToastItem[] {
  const [list, setList] = useState<ToastItem[]>([])
  useEffect(() => {
    listeners.add(setList)
    setList([...items])
    return () => {
      listeners.delete(setList)
    }
  }, [])
  return list
}
