"use client"

import { useTranslations } from "next-intl"
import { useSocketState } from "@/services/useSocketState"
import { useEffect, useState } from "react"
import useSocketStore from "@/stores/useSocketStore"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"

/**
 * Connection status banner for SmartRotom.
 *
 * Shows when reconnecting or offline, with appropriate messaging and actions.
 * Uses SmartRotom's design system (components/smartrotom/ui) for consistency.
 */
export function RotomConnectionBanner() {
  const t = useTranslations("common.connection")
  const { state, isReconnecting, isOffline, isFailed } = useSocketState()
  const { socket } = useSocketStore()
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)

  // Update retry countdown when reconnect attempt changes
  useEffect(() => {
    if (!isReconnecting || !socket) {
      setRetryCountdown(null)
      return
    }

    // Socket.io's reconnectionDelay is already exponential,
    // so we just show a generic reconnecting state
    setRetryCountdown(null)
  }, [isReconnecting, socket])

  if (state === "connected") {
    return null
  }

  const isDegraded = isReconnecting || isOffline || isFailed

  if (!isDegraded) {
    return null
  }

  const handleRetry = () => {
    if (isOffline && socket) {
      socket.connect()
    }
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 text-sm font-medium border-2 ${
        isFailed
          ? "bg-rose-100 text-rose-900 border-rose-300"
          : "bg-yellow-100 text-yellow-900 border-yellow-300"
      }`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {isReconnecting ? (
        <Wifi className="h-4 w-4 animate-pulse flex-shrink-0" />
      ) : (
        <WifiOff className="h-4 w-4 flex-shrink-0" />
      )}

      <div className="flex-1">
        {isReconnecting && (
          <span>
            {t("reconnecting")} {t("working")}
          </span>
        )}
        {isOffline && (
          <span>{t("offline")}</span>
        )}
        {isFailed && (
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("failed")}
          </span>
        )}
      </div>

      {isOffline && (
        <button
          onClick={handleRetry}
          className={`flex-shrink-0 px-3 py-1 border-2 font-bold transition-colors ${
            isFailed
              ? "bg-rose-200 hover:bg-rose-300 text-rose-900 border-rose-400"
              : "bg-yellow-200 hover:bg-yellow-300 text-yellow-900 border-yellow-400"
          }`}
          aria-label={t("tryReconnect")}
        >
          {t("tryReconnect")}
        </button>
      )}
    </div>
  )
}
