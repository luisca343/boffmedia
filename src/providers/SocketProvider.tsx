"use client"

import { useSocketAuth } from "@/services/useSocketAuth"
import { type ReactNode, useEffect } from "react"

export function SocketProvider({ children }: { children: ReactNode }) {
  // Initialize socket connection and auth listeners
  const socket = useSocketAuth()

  useEffect(() => {
    console.log("SocketProvider mounted")
    return () => {
      console.log("SocketProvider unmounted")
    }
  }, [])

  useEffect(() => {
    console.log("Socket in SocketProvider changed", { socketExists: !!socket })
    console.log("New socket", socket?.id)
  }, [socket])

  return <>{children}</>
}

