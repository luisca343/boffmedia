import useSocketStore, { type SocketConnectionState } from "@/stores/useSocketStore"

export interface UseSocketStateResult {
  state: SocketConnectionState
  isConnected: boolean
  isReconnecting: boolean
  isOffline: boolean
  isFailed: boolean
  reconnectAttempt: number
}

/**
 * Hook to consume socket connection state.
 *
 * Use this to determine if the app is currently degraded (reconnecting/offline/failed)
 * and whether to show a warning banner or retry UI.
 *
 * @example
 * const { state, isReconnecting } = useSocketState()
 * if (isReconnecting) return <ReconnectBanner />
 */
export function useSocketState(): UseSocketStateResult {
  const { connectionState, reconnectAttempt } = useSocketStore()

  return {
    state: connectionState,
    isConnected: connectionState === "connected",
    isReconnecting: connectionState === "reconnecting",
    isOffline: connectionState === "offline",
    isFailed: connectionState === "failed",
    reconnectAttempt,
  }
}
