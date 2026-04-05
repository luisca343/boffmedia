'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle, BellOff } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/primitives/popover"
import { ScrollArea } from "@/components/ui/primitives/scroll-area"
import { Button } from "@/components/ui/primitives/button"
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
      className="group relative flex items-start gap-2 mx-1 px-2 py-1.5 rounded transition-colors duration-150 hover:bg-primary-500/[0.07]"
      style={{ background: isUnread ? "rgba(249,115,22,0.04)" : undefined }}
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
        <p className="text-xs text-surface-300 leading-snug line-clamp-2">
          {notification.content}
        </p>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(100,116,139,0.7)" }}>
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
            className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-primary-500/10"
            style={{ color: "rgba(249,115,22,0.6)" }}
            title="Marcar como leído"
          >
            <CheckCheck className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-red-500/10"
          style={{ color: "rgba(100,116,139,0.6)" }}
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
      {/* ── Trigger (same style as FicusNav ghost buttons) ───────────────── */}
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-surface-800/40 transition-colors duration-150"
        >
          <Bell
            className="h-4 w-4"
            style={{ color: unreadCount > 0 ? "rgb(251,146,60)" : "rgba(148,163,184,0.7)" }}
          />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center px-1 rounded-full text-[9px] font-black font-mono leading-none"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "rgb(248,113,113)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/* ── Panel (exact dropdown panel spec) ───────────────────────────── */}
      <PopoverContent
        align="end"
        className="w-72 p-0 border rounded-lg overflow-hidden backdrop-blur-xl"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(9,13,27,0.99))",
          borderColor: "rgba(249,115,22,0.18)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(249,115,22,0.04), 0 0 40px rgba(0,0,0,0.5)",
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
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: "rgba(100,116,139,0.7)", fontFamily: "Orbitron, sans-serif" }}
            >
              {unreadCount > 0 ? (
                <>
                  Notificaciones{" "}
                  <span style={{ color: "rgba(251,146,60,0.8)" }}>· {unreadCount}</span>
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
                  className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-primary-500/10"
                  style={{ color: "rgba(249,115,22,0.55)" }}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3 h-3" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clear()}
                  className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-primary-500/10"
                  style={{ color: "rgba(100,116,139,0.5)" }}
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
                "linear-gradient(90deg, transparent, rgba(71,85,105,0.35), transparent)",
            }}
          />

          {/* Body */}
          <ScrollArea className="max-h-64">
            {notifications.length === 0 ? (
              <div className="flex items-center gap-2 mx-1 px-2 py-3 text-xs text-surface-500">
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
