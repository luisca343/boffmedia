/**
 * Seconds left in the opponent's disconnect grace window, or null when nobody
 * is disconnected.
 *
 * Derived from the server's absolute `expiresAt`, never by decrementing a local
 * duration: a backgrounded tab throttles intervals, so a local countdown drifts
 * away from the deadline the server will actually act on.
 *
 * The server owns the forfeit. This is display only — `onExpired` exists to let
 * the banner change wording while the battleEnd frame is in flight, not to
 * decide anything.
 */

import { useEffect, useRef, useState } from "react"
import type { PvpOpponentDisconnectState } from "./pvpInbox"

const TICK_MS = 100

export function useOpponentDisconnectCountdown(
  disconnect: PvpOpponentDisconnectState | null,
  onExpired?: () => void,
): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  // Kept in a ref so an inline arrow from the caller does not re-run the effect
  // on every render, tearing down and rebuilding the interval each time.
  const expiredRef = useRef(onExpired)
  expiredRef.current = onExpired

  const expiresAt = disconnect?.expiresAt ?? null

  useEffect(() => {
    if (expiresAt === null) {
      setRemainingMs(null)
      return
    }

    const read = () => Math.max(0, expiresAt - Date.now())

    const initial = read()
    setRemainingMs(initial)
    if (initial <= 0) {
      expiredRef.current?.()
      return
    }

    const interval = setInterval(() => {
      const remaining = read()
      setRemainingMs(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        expiredRef.current?.()
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [expiresAt])

  return remainingMs === null ? null : Math.ceil(remainingMs / 1000)
}
