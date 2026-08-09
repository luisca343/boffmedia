import type { SmartRotomUser } from "@/types"
import io, { type Socket } from "socket.io-client"
import { create } from "zustand"
import { env } from "@/config/env.public"
import { isMinecraft } from "@/services/mcef/mcefHelper"
import { sessionToken } from "@/services/http/core"

interface SocketStore {
  socket: Socket | null
  user: SmartRotomUser | null
  connect: (user: SmartRotomUser) => void
  disconnect: () => void
  isConnecting: boolean
}

const RECONNECTION_ATTEMPTS = 3
const RECONNECTION_DELAY = 5000 // 5 seconds

type SetState = (partial: Partial<SocketStore>) => void

function wire(socket: Socket, user: SmartRotomUser, set: SetState) {
  socket.on("connect", () => {
    set({ user, socket, isConnecting: false })
    // The gateway takes the uuid from the token, not from here — this payload
    // now only carries `inGame`, which is a presentation flag (online vs
    // in-game) rather than an identity claim.
    socket.emit("smartrotom:connection", { ...user, inGame: isMinecraft() })
  })

  // The gateway disconnects a socket it cannot authenticate. Reconnecting into
  // the same refusal would spin forever, so this path gives up and clears.
  socket.on("auth:error", () => {
    socket.disconnect()
    set({ user: null, socket: null, isConnecting: false })
  })

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      // The disconnection was initiated by the server, you need to reconnect manually
      socket.connect()
    }
    // Else the socket will automatically try to reconnect
  })

  socket.on("reconnect_failed", () => {
    set({ user: null, socket: null, isConnecting: false })
  })
}

const useSocketStore = create<SocketStore>((set, get) => ({
  user: null,
  socket: null,
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
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
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
    set({ user: null, socket: null, isConnecting: false })
  },
}))

export default useSocketStore
