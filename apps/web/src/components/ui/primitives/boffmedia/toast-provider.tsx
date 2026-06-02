"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

const TOAST_ICONS: Record<string, string> = { info: "info", success: "check", warning: "flame", error: "x", neutral: "sparkles" }

interface ToastData {
  id: string
  tone: "neutral" | "success" | "error" | "warning" | "info"
  title: string
  desc?: string
  duration?: number
}

type PushToast = (t: Omit<ToastData, "id"> & { duration?: number }) => void

const ToastCtx = React.createContext<PushToast>(() => {})

export function useToast() { return React.useContext(ToastCtx) }

const toneIconColor: Record<string, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  warning: "text-amber-400",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])
  const push: PushToast = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((arr) => [...arr, { id, tone: "neutral", ...t }])
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), t.duration || 3600)
  }, [])
  const dismiss = (id: string) => setToasts((arr) => arr.filter((x) => x.id !== id))

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 pointer-events-none" role="region" aria-label="Notificaciones">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex gap-3 items-start min-w-[290px] max-w-[360px] py-3.5 px-4",
              "rounded-[var(--radius-lg,22px)]",
              "bg-[var(--surface)]",
              "border border-solid border-[var(--border-strong)]",
              "shadow-[0_24px_50px_-20px_var(--shadow-color)]",
              "animate-k-toast-in",
              "data-[direction=neon]:backdrop-blur-[4px] data-[direction=neon]:bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]",
              "data-[direction=hud]:shadow-[5px_5px_0_0_var(--hud-shadow)]",
            )}
          >
            <span className={cn("text-[var(--accent-bright)] mt-px", toneIconColor[t.tone])}>
              <Icon name={TOAST_ICONS[t.tone] || "sparkles"} size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t.title}</p>
              {t.desc && <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.desc}</p>}
            </div>
            <button className="border-0 bg-transparent text-[var(--text-dim)] cursor-pointer p-0.5 hover:text-[var(--text)]" aria-label="Cerrar" onClick={() => dismiss(t.id)}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
