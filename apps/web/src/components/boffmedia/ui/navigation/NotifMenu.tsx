"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"

interface Notif {
  id: number
  icon: string
  tone: "accent" | "info" | "muted"
  text: string
  time: string
  read: boolean
}

const SEED: Notif[] = [
  { id: 1, icon: "trophy", tone: "accent", text: "Tu equipo quedó 3.º en el Torneo Wingull 2.", time: "hace 2 min", read: false },
  { id: 2, icon: "gift", tone: "info", text: "Nuevo sorteo: clave de Steam disponible.", time: "hace 1 h", read: false },
  { id: 3, icon: "message", tone: "muted", text: "RotomChef respondió a tu hilo del foro.", time: "hace 3 h", read: false },
  { id: 4, icon: "star", tone: "muted", text: "Desbloqueaste el logro «Racha de 10».", time: "ayer", read: true },
]

const TONE_VAR: Record<Notif["tone"], string> = {
  accent: "var(--accent)",
  info: "var(--info)",
  muted: "var(--muted)",
}

const POP_CLIP = "polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%)"

export function NotifMenu() {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Notif[]>(SEED)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const unread = items.filter((n) => !n.read).length

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <span className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        aria-label="Notificaciones"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-grid h-10 w-10 place-items-center border border-solid bg-panel transition-[color,border-color,background] duration-[140ms]",
          "cut-tag",
          open ? "border-accent-line text-accent-bright" : "border-line text-txt-muted hover:border-accent-line hover:text-accent-bright",
        )}
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span className="absolute -right-[5px] -top-[5px] grid h-[17px] min-w-[17px] place-items-center border-2 border-base bg-accent px-1 font-mono text-[10px] font-extrabold leading-none text-accent-ink cut [--cut:3px]">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notificaciones"
          style={{ clipPath: POP_CLIP }}
          className="absolute right-0 top-[calc(100%_+_8px)] z-[70] w-[340px] border border-solid border-line-2 border-t-accent bg-panel shadow-[0_24px_54px_-22px_rgba(0,0,0,0.75)] animate-[bm-nd-pop_0.14s_ease-out]"
        >
          <header className="flex items-center gap-2 border-b border-line px-[15px] pb-[11px] pt-[13px]">
            <b className="flex-1 font-display text-[13px] font-bold uppercase leading-none tracking-[0.04em] text-txt">
              Notificaciones
            </b>
            {items.length > 0 && (
              <span className="inline-flex gap-3">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems((a) => a.map((n) => ({ ...n, read: true })))}
                    className="font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors duration-[140ms] hover:text-accent"
                  >
                    Marcar leídas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors duration-[140ms] hover:text-accent"
                >
                  Limpiar
                </button>
              </span>
            )}
          </header>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-4 py-[34px] text-txt-dim">
              <Icon name="bell" size={26} />
              <span className="font-body text-[13px] font-medium leading-none">Sin notificaciones</span>
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group/notif flex items-start gap-[11px] border-b border-line px-[15px] py-3 transition-colors duration-[140ms] hover:bg-panel-2",
                    n.read && "opacity-60",
                  )}
                >
                  <span
                    className="mt-px grid h-[30px] w-[30px] shrink-0 place-items-center border border-solid cut [--cut:5px]"
                    style={{
                      color: TONE_VAR[n.tone],
                      background: `color-mix(in srgb, ${TONE_VAR[n.tone]} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${TONE_VAR[n.tone]} 26%, transparent)`,
                    }}
                  >
                    <Icon name={n.icon} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] leading-[1.4] text-txt">{n.text}</p>
                    <time className="mt-[3px] block font-mono text-[10.5px] font-medium leading-none tracking-[0.05em] text-txt-dim">
                      {n.time}
                    </time>
                  </div>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => setItems((a) => a.filter((x) => x.id !== n.id))}
                    className="-mr-1 -mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center text-txt-dim opacity-0 transition-[color,opacity] duration-[140ms] hover:text-bad group-hover/notif:opacity-100"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  )
}
