'use client'

import { useState, useEffect } from 'react'
import { X, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle, BellOff } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/primitives/popover"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { useNotificationCenter } from "react-toastify/addons/use-notification-center"

// ─── Type config ──────────────────────────────────────────────────────────────

type ToastType = 'info' | 'success' | 'warning' | 'error' | 'default' | string

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; border: string; bg: string }> = {
  success:  { icon: CheckCircle,   color: "rgb(163,230,53)",   border: "rgba(132,204,22,0.3)", bg: "rgba(132,204,22,0.07)" },
  error:    { icon: AlertCircle,   color: "rgb(248,113,113)",  border: "rgba(239,68,68,0.3)",  bg: "rgba(239,68,68,0.07)"  },
  warning:  { icon: AlertTriangle, color: "rgb(250,204,21)",   border: "rgba(250,204,21,0.3)", bg: "rgba(250,204,21,0.07)" },
  info:     { icon: Info,          color: "rgb(34,211,238)",   border: "rgba(6,182,212,0.3)",  bg: "rgba(6,182,212,0.07)"  },
  default:  { icon: Info,          color: "rgb(251,146,60)",   border: "rgba(249,115,22,0.3)", bg: "rgba(249,115,22,0.07)" },
}
const getTypeConfig = (type: ToastType) => TYPE_CONFIG[type] ?? TYPE_CONFIG.default

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000)     return "ahora"
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  return `${Math.floor(diff / 86_400_000)}d`
}

// ─── Notification item (mirrors dropdown MotionLink row style) ────────────────

function NotificationItem({
  notification,
  onRemove,
  onMarkAsRead,
}: {
  notification: any
  onRemove: () => void
  onMarkAsRead: () => void
}) {
  const cfg = getTypeConfig(notification.type)
  const TypeIcon = cfg.icon
  const isUnread = !notification.read

  return (
    <div
      className="group relative flex items-start gap-2 mx-1 px-2 py-1.5 rounded-[var(--radius)] transition-colors duration-[var(--dur)] hover:bg-[color-mix(in_srgb,var(--orange-500)_7%,transparent)]"
      style={{ background: isUnread ? "color-mix(in srgb, var(--orange-500) 4%, transparent)" : undefined }}
    >
      {/* Type icon */}
      <div
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <TypeIcon className="w-3 h-3" style={{ color: cfg.color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-xs text-[var(--text-muted)] leading-snug line-clamp-2">
          {notification.content}
        </p>
        <p className="text-[10px] font-mono mt-0.5 text-[var(--text-dim)]">
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: cfg.color }}
        />
      )}

      {/* Hover actions */}
      <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-0.5">
        {isUnread && (
          <button
            onClick={onMarkAsRead}
            className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)] text-[var(--orange-500)]"
            title="Marcar como leído"
          >
            <CheckCheck className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] text-[var(--text-dim)]"
          title="Eliminar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NotificationPopover() {
  const [mounted, setMounted] = useState(false)
  const { notifications, clear, markAllAsRead, markAsRead, remove, unreadCount } =
    useNotificationCenter()

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <Popover>
      {/* ── Trigger (matches handoff IconButton with dot) ──────────────── */}
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex items-center justify-center w-[38px] h-[38px] rounded-[var(--btn-radius)] border border-transparent bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] cursor-pointer transition-colors duration-[var(--dur)]"
          aria-label="Notificaciones"
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && (
            <span
              className="absolute top-[8px] right-[9px] w-[6px] h-[6px] rounded-full"
              style={{ background: 'var(--orange-500)', border: '2px solid var(--bg)' }}
            />
          )}
        </button>
      </PopoverTrigger>

      {/* ── Panel (exact dropdown panel spec) ───────────────────────────── */}
      <PopoverContent
        align="end"
        className="w-72 p-0 border border-[var(--border)] rounded-lg overflow-hidden backdrop-blur-xl"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {/* Top neon bar — identical to dropdown */}
        <div
          className="h-[2px] bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600"
          style={{ opacity: 0.7 }}
        />

        <div className="py-1">
          {/* Section header — same style as dropdown section titles */}
          <div className="flex items-center justify-between px-3 pt-1.5 pb-0.5">
            <h3
              className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-dim)]"
            >
              {unreadCount > 0 ? (
                <>
                  Notificaciones{" "}
                  <span className="text-[var(--orange-500)]">· {unreadCount}</span>
                </>
              ) : (
                "Notificaciones"
              )}
            </h3>

            {/* Header actions */}
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)] text-[var(--orange-500)]"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clear()}
                  className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)] text-[var(--text-dim)]"
                  title="Limpiar todo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Divider — same as between dropdown sections */}
          <div
            className="h-px mx-2 my-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--border), transparent)",
            }}
          />

          {/* Body */}
          <ScrollArea className="h-64">
            {notifications.length === 0 ? (
              <div className="flex items-center gap-2 mx-1 px-2 py-3 text-xs text-[var(--text-dim)]">
                <BellOff className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                <span>Sin notificaciones</span>
              </div>
            ) : (
              <div className="pb-0.5">
                {notifications.map((notification: any) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => remove(notification.id)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
