import type { SmartRotomUser } from "@/types"
import io, { type Socket } from "socket.io-client"
import { create } from "zustand"

interface SocketStore {
  socket: Socket | null
  user: SmartRotomUser | null
  connect: (user: SmartRotomUser) => void
  disconnect: () => void
  isConnecting: boolean
}

const RECONNECTION_ATTEMPTS = 3
const RECONNECTION_DELAY = 5000 // 5 seconds

const useSocketStore = create<SocketStore>((set, get) => ({
  user: null,
  socket: null,
  isConnecting: false,
  connect: (user) => {
    console.log("Connect function called", { existingSocket: !!get().socket, isConnecting: get().isConnecting })
    if (get().socket || get().isConnecting) {
      console.log("Socket connection already exists or is in progress, skipping connection")
      return
    }

    set({ isConnecting: true })

    // Connect to NestJS Socket.io server
    console.log("Creating new socket connection")
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
      port: 34304,
      transports: ["websocket"],
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
    })

    socket.on("connect", () => {
      console.log("Socket connected")
      set({ user, socket, isConnecting: false })
      // Emit smartrotom:connection event as expected by the gateway
      socket.emit("smartrotom:connection", user)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected", reason)
      if (reason === "io server disconnect") {
        // The disconnection was initiated by the server, you need to reconnect manually
        socket.connect()
      }
      // Else the socket will automatically try to reconnect
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    socket.on("reconnect_failed", () => {
      console.log("Reconnection failed after maximum attempts")
      set({ user: null, socket: null, isConnecting: false })
    })
  },
  disconnect: () => {
    console.log("Disconnect function called")
    get().socket?.disconnect()
    set({ user: null, socket: null, isConnecting: false })
  },
}))

export default useSocketStore

