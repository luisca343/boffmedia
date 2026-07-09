"use client"

import { NotifMenu } from "./NotifMenu"
import { useNotifications } from "@/hooks/notifications/useNotifications"

/** Navbar bell wired to the real notifications API. Empty state when logged out. */
export function NotifBell() {
  const { items, markAllRead, dismiss, clear } = useNotifications()
  return (
    <NotifMenu
      initialItems={items}
      onMarkAllRead={markAllRead}
      onDismiss={dismiss}
      onClear={clear}
    />
  )
}
