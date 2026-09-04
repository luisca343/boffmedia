"use client"

import { useTranslations } from "next-intl"
import { useSocketState } from "@/services/useSocketState"
import { useEffect, useState } from "react"
import useSocketStore from "@/stores/useSocketStore"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"

/**
 * Connection status banner for BoffMedia (web shell).
 *
 * Shows when reconnecting or offline, with appropriate messaging and actions.
 * Uses @boffmedia/ui primitives for consistency with the web design system.
 */
export function BoffmediaConnectionBanner() {
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
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 text-sm ${
        isFailed
          ? "bg-red-50 text-red-900 border-b border-red-200"
          : "bg-amber-50 text-amber-900 border-b border-amber-200"
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
          className={`flex-shrink-0 px-3 py-1 rounded text-sm font-medium transition-colors ${
            isFailed
              ? "bg-red-200 hover:bg-red-300 text-red-900"
              : "bg-amber-200 hover:bg-amber-300 text-amber-900"
          }`}
          aria-label={t("tryReconnect")}
        >
          {t("tryReconnect")}
        </button>
      )}
    </div>
  )
}
