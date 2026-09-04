import type { SmartRotomUser } from "@/types"
import io, { type Socket } from "socket.io-client"
import { create } from "zustand"
import { env } from "@/config/env.public"
import { isMinecraft } from "@/services/mcef/mcefHelper"
import { sessionToken } from "@/services/http/core"

export type SocketConnectionState = "connected" | "reconnecting" | "offline" | "failed"

interface SocketStore {
  socket: Socket | null
  user: SmartRotomUser | null
  connectionState: SocketConnectionState
  reconnectAttempt: number
  connect: (user: SmartRotomUser) => void
  disconnect: () => void
  isConnecting: boolean
}

// Socket.io v4 automatically applies exponential backoff:
// starting from reconnectionDelay, doubling each attempt up to reconnectionDelayMax.
// Pattern: 1s, 2s, 4s, 8s, 16s, 32s, 60s (capped)
const INITIAL_RECONNECTION_DELAY = 1000 // 1 second
const MAX_RECONNECTION_DELAY = 60000 // 60 seconds (give up after ~7 exponential attempts)
const MAX_RECONNECTION_ATTEMPTS = 5

type SetState = (partial: Partial<SocketStore>) => void

function wire(socket: Socket, user: SmartRotomUser, set: SetState) {
  socket.on("connect", () => {
    set({ user, socket, isConnecting: false, connectionState: "connected", reconnectAttempt: 0 })
    // The gateway takes the uuid from the token, not from here — this payload
    // now only carries `inGame`, which is a presentation flag (online vs
    // in-game) rather than an identity claim.
    socket.emit("smartrotom:connection", { ...user, inGame: isMinecraft() })
  })

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      // The disconnection was initiated by the server, you need to reconnect manually
      set({ connectionState: "offline" })
      socket.connect()
    } else {
      // Socket will automatically try to reconnect; mark as reconnecting
      set({ connectionState: "reconnecting" })
    }
  })

  socket.on("connect_error", () => {
    set({ connectionState: "reconnecting" })
  })

  // The gateway disconnects a socket it cannot authenticate. Reconnecting into
  // the same refusal would spin forever, so this path gives up and clears.
  socket.on("auth:error", () => {
    socket.disconnect()
    set({ user: null, socket: null, isConnecting: false, connectionState: "failed" })
  })

  socket.on("reconnect_failed", () => {
    set({ user: null, socket: null, isConnecting: false, connectionState: "failed" })
  })

  socket.on("reconnect_attempt", (attempt: number) => {
    set({ reconnectAttempt: attempt, connectionState: "reconnecting" })
  })
}

const useSocketStore = create<SocketStore>((set, get) => ({
  user: null,
  socket: null,
  connectionState: "offline",
  reconnectAttempt: 0,
  isConnecting: false,
  connect: (user) => {
    if (get().socket || get().isConnecting) return

    set({ isConnecting: true })

    // The gateway authenticates the handshake and drops anything that cannot
    // prove who it is, so the token has to be in place before connecting.
    // `auth` is a callback rather than a fixed value because socket.io re-runs
    // it on every reconnect — a token that expired mid-session would otherwise
    // make every retry fail identically.
    const socket = io(env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: INITIAL_RECONNECTION_DELAY,
      reconnectionDelayMax: MAX_RECONNECTION_DELAY,
      autoConnect: false,
      auth: (cb) => {
        void sessionToken()
          .then((token) => cb({ token }))
          .catch(() => cb({ token: "" }))
      },
    })

    wire(socket, user, set)
    socket.connect()
  },
  disconnect: () => {
    get().socket?.disconnect()
    set({ user: null, socket: null, isConnecting: false, connectionState: "offline" })
  },
}))

export default useSocketStore
