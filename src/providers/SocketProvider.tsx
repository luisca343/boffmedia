"use client"

import { useSocketAuth } from "@/services/useSocketAuth"
import { type ReactNode, useEffect } from "react"

export function SocketProvider({ children }: { children: ReactNode }) {
  // Initialize socket connection and auth listeners
  const socket = useSocketAuth()

  useEffect(() => {
    return () => {
      console.log("SocketProvider unmounted")
    }
  }, [])

  useEffect(() => {
  }, [socket])

  return <>{children}</>
}

