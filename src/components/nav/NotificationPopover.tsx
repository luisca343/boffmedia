'use client'

import { useState, useEffect } from 'react'
import { Bell } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useNotificationCenter } from "react-toastify/addons/use-notification-center"

export default function NotificationPopover() {
  const [mounted, setMounted] = useState(false)
  const {
    notifications,
    clear,
    markAllAsRead,
    markAsRead,
    remove,
    unreadCount,
  } = useNotificationCenter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative hover:bg-gray-800 transition-colors duration-200">
          <Bell className="h-5 w-5 text-orange-300" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gray-800 border-gray-700 text-orange-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          <Button variant="ghost" size="sm" onClick={() => clear()}>
            Limpiar todo
          </Button>
        </div>
        <ScrollArea className="h-64">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              No hay notificaciones
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="mb-2 p-2 bg-gray-700 rounded"
              >
                <p className="text-sm">{notification.content}</p>
                <div className="flex justify-end mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(notification.id)}
                  >
                    Eliminar
                  </Button>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Marcar como leído
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}