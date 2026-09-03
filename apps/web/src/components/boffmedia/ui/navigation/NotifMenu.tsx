"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@boffmedia/ui"
import { useDismiss } from "@boffmedia/ui/hooks/use-dismiss"

export interface Notif {
  id: number
  icon: IconName
  tone: "accent" | "info" | "muted"
  text: string
  time: string
  read: boolean
}

const TONE_VAR: Record<Notif["tone"], string> = {
  accent: "var(--accent)",
  info: "var(--info)",
  muted: "var(--muted)",
}

export interface NotifMenuProps {
  /** Notifications to show. Defaults to the empty state; `NotifBell` passes real data, the showcase injects demo items. */
  initialItems?: Notif[]
  /** Optional persistence hooks — when provided, the local action is also sent to the API. */
  onMarkAllRead?: () => void
  onDismiss?: (id: number) => void
  onClear?: () => void
}

export function NotifMenu({ initialItems, onMarkAllRead, onDismiss, onClear }: NotifMenuProps) {
  const tNav = useTranslations("nav.v3")
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Notif[]>(initialItems ?? [])
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const unread = items.filter((n) => !n.read).length

  // Sync when the source list changes (e.g. NotifBell finishes fetching).
  React.useEffect(() => {
    setItems(initialItems ?? [])
  }, [initialItems])

  useDismiss(rootRef, () => setOpen(false), open)

  return (
    <span className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        aria-label={tNav("notifications")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-grid h-10 w-10 place-items-center border border-solid bg-panel transition-[color,border-color,background] duration-[140ms]",
          "cut-tag cut-tag-edge",
          open
            ? "border-accent-line [--cut-line:var(--accent-line)] text-accent-bright"
            : "border-line [--cut-line:var(--line)] text-txt-muted hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:text-accent-bright",
        )}
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span className="absolute -right-[0.3125rem] -top-[0.3125rem] grid h-[1.0625rem] min-w-[1.0625rem] place-items-center border-2 border-base bg-accent px-1 font-mono text-[0.625rem] font-extrabold leading-none text-accent-ink cut cut-edge-slant [--cut:3px] [--cut-w:2px] [--cut-line:var(--base)]">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={tNav("notifications")}
          className="cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:10px] absolute right-0 top-[calc(100%_+_8px)] z-[70] w-[21.25rem] border border-solid border-line-2 border-t-accent bg-panel shadow-[0_24px_54px_-22px_rgba(0,0,0,0.75)] animate-[bm-nd-pop_0.14s_ease-out] motion-reduce:animate-none"
        >
          <header className="flex items-center gap-2 border-b border-line px-[0.9375rem] pb-[0.6875rem] pt-[0.8125rem]">
            <b className="flex-1 font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.04em] text-txt">
              {tNav("notifications")}
            </b>
            {items.length > 0 && (
              <span className="inline-flex gap-3">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setItems((a) => a.map((n) => ({ ...n, read: true })))
                      onMarkAllRead?.()
                    }}
                    className="font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors duration-[140ms] hover:text-accent"
                  >
                    {tNav("markRead")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setItems([])
                    onClear?.()
                  }}
                  className="font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors duration-[140ms] hover:text-accent"
                >
                  {tNav("clear")}
                </button>
              </span>
            )}
          </header>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-4 py-[2.125rem] text-txt-dim">
              <Icon name="bell" size={26} />
              <span className="font-body text-[0.8125rem] font-medium leading-none">{tNav("noNotifications")}</span>
            </div>
          ) : (
            <div className="max-h-[17.5rem] overflow-y-auto">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group/notif flex items-start gap-[0.6875rem] border-b border-line px-[0.9375rem] py-3 transition-colors duration-[140ms] hover:bg-panel-2",
                    n.read && "opacity-60",
                  )}
                >
                  <span
                    className="mt-px grid h-[1.875rem] w-[1.875rem] shrink-0 place-items-center border border-solid cut cut-edge-slant [--cut:5px]"
                    style={{
                      color: TONE_VAR[n.tone],
                      background: `color-mix(in srgb, ${TONE_VAR[n.tone]} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${TONE_VAR[n.tone]} 26%, transparent)`,
                      "--cut-line": `color-mix(in srgb, ${TONE_VAR[n.tone]} 26%, transparent)`,
                    } as React.CSSProperties}
                  >
                    <Icon name={n.icon} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[0.8125rem] leading-[1.4] text-txt">{n.text}</p>
                    <time className="mt-[3px] block font-mono text-[0.65625rem] font-medium leading-none tracking-[0.05em] text-txt-dim">
                      {n.time}
                    </time>
                  </div>
                  <button
                    type="button"
                    aria-label={tNav("delete")}
                    onClick={() => {
                      setItems((a) => a.filter((x) => x.id !== n.id))
                      onDismiss?.(n.id)
                    }}
                    className="-mr-1 -mt-0.5 grid h-[1.375rem] w-[1.375rem] shrink-0 place-items-center text-txt-dim opacity-0 transition-[color,opacity] duration-[140ms] hover:text-bad group-hover/notif:opacity-100"
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
