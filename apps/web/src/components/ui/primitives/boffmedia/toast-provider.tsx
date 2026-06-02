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
      <div className="k-toaster" role="region" aria-label="Notificaciones">
        {toasts.map((t) => (
          <div key={t.id} className={cn("k-toast", `k-toast--${t.tone}`)}>
            <span className="k-toast__icon"><Icon name={TOAST_ICONS[t.tone] || "sparkles"} size={16} /></span>
            <div className="k-toast__body">
              <p className="k-toast__title">{t.title}</p>
              {t.desc && <p className="k-toast__desc">{t.desc}</p>}
            </div>
            <button className="k-toast__x" aria-label="Cerrar" onClick={() => dismiss(t.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
