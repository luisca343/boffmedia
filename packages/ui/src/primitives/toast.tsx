"use client"

import * as React from "react"
import { cn } from "../cn"
import { useT } from "../i18n"
import { Icon, type IconName } from "./icon"

export type ToastTone = "ok" | "bad" | "warn" | "info"

export interface ToastOptions {
  title?: React.ReactNode
  msg?: React.ReactNode
  tone?: ToastTone
  duration?: number
  icon?: IconName
  action?: { label: React.ReactNode; onClick?: () => void }
}

interface ToastItem extends ToastOptions {
  id: number
}

const TONE_VAR: Record<ToastTone, string> = {
  ok: "var(--ok)",
  bad: "var(--bad)",
  warn: "var(--warn)",
  info: "var(--info)",
}

const TONE_ICON: Record<ToastTone, IconName> = { ok: "check", bad: "alert", warn: "alert", info: "info" }

// Imperative entry point — dispatch from anywhere; mount <ToastStack/> once
// (done in `(boffmedia)/layout.tsx`).
export function toast(opts: ToastOptions | string) {
  const detail = typeof opts === "string" ? { msg: opts } : opts || {}
  window.dispatchEvent(new CustomEvent("bm:toast", { detail }))
}

type ToneOptions = Omit<ToastOptions, "msg" | "tone">
const withTone = (tone: ToastTone) => (msg: React.ReactNode, opts?: ToneOptions) =>
  toast({ ...opts, msg, tone })

toast.success = withTone("ok")
toast.error = withTone("bad")
toast.warn = withTone("warn")
toast.info = withTone("info")

export function ToastStack() {
  const tr = useT()
  const [items, setItems] = React.useState<ToastItem[]>([])
  const seq = React.useRef(0)
  const remove = (id: number) => setItems((a) => a.filter((t) => t.id !== id))

  React.useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastOptions>).detail || {}
      const id = ++seq.current
      const t: ToastItem = { id, tone: "info", duration: 4200, ...detail }
      setItems((a) => a.concat([t]).slice(-4))
      if (t.duration && t.duration > 0) setTimeout(() => remove(id), t.duration)
    }
    window.addEventListener("bm:toast", onToast)
    return () => window.removeEventListener("bm:toast", onToast)
  }, [])

  return (
    <div
      role="region"
      aria-label={tr("notifications")}
      aria-live="polite"
      className="fixed right-[22px] bottom-[22px] z-[900] flex flex-col gap-[10px] max-w-[min(380px,calc(100vw_-_44px))] pointer-events-none"
    >
      {items.map((t) => {
        const tone = t.tone || "info"
        return (
          <div
            key={t.id}
            role="status"
            style={{ ["--tc" as string]: TONE_VAR[tone], boxShadow: "0 18px 44px -20px rgba(0,0,0,0.7)" }}
            className={cn(
              "pointer-events-auto flex items-start gap-[11px] py-[13px] px-[14px] bg-panel border border-solid border-line-2 border-l-[3px] border-l-[var(--tc)]",
              "cut-tag cut-tag-edge [--cut-tag:9px] [--cut-line:var(--line-2)]",
              "animate-[bm-toast-in_0.22s_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none",
            )}
          >
            <span className="flex-none mt-px text-[var(--tc)]">
              <Icon name={t.icon || TONE_ICON[tone]} size={16} />
            </span>
            <div className="flex-1 flex flex-col gap-[3px] min-w-0">
              {t.title && <b className="font-display text-[13px] font-bold leading-[1.2] tracking-[0.02em] text-txt">{t.title}</b>}
              {t.msg && <span className="font-body text-[13px] leading-[1.45] text-txt-muted">{t.msg}</span>}
            </div>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick?.()
                  remove(t.id)
                }}
                className="flex-none self-start mt-px p-0 border-0 bg-transparent font-mono text-[11px] font-bold leading-none uppercase tracking-[0.08em] text-accent cursor-pointer hover:text-accent-bright"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label={tr("dismiss")}
              onClick={() => remove(t.id)}
              className="flex-none grid place-items-center w-[22px] h-[22px] -mt-[3px] -mr-1 p-0 border-0 bg-transparent text-txt-dim cursor-pointer hover:text-txt transition-colors"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
