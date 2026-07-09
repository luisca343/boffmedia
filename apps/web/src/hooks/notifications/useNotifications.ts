"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
  NotificationsService,
  type ApiNotification,
  type NotificationType,
} from "@/services/api/boffmedia/notificationsService"
import type { Notif } from "@/components/boffmedia/ui/navigation/NotifMenu"

const TONE_BY_TYPE: Record<NotificationType, Notif["tone"]> = {
  event: "info",
  achievement: "accent",
  tournament: "accent",
  system: "muted",
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

function toNotif(n: ApiNotification): Notif {
  return {
    id: n.id,
    icon: "bell",
    tone: TONE_BY_TYPE[n.type] ?? "muted",
    text: n.body ? `${n.title} — ${n.body}` : n.title,
    time: relTime(n.createdAt),
    read: n.readAt != null,
  }
}

/** Real notifications for the navbar bell. Empty (no fetch) when logged out. */
export function useNotifications() {
  const { status } = useSession()
  const [items, setItems] = useState<Notif[]>([])

  const refetch = useCallback(async () => {
    if (status !== "authenticated") {
      setItems([])
      return
    }
    try {
      const res = await NotificationsService.list(30)
      if (res.data) setItems(res.data.map(toNotif))
    } catch {
      /* leave items as-is on transient failure */
    }
  }, [status])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Fire-and-forget persistence; NotifMenu updates its own local state optimistically.
  const markAllRead = useCallback(() => {
    void NotificationsService.markAllRead()
  }, [])
  const dismiss = useCallback((id: number) => {
    void NotificationsService.remove(id)
  }, [])
  const clear = useCallback(() => {
    void NotificationsService.clear()
  }, [])

  return { items, markAllRead, dismiss, clear, refetch }
}
