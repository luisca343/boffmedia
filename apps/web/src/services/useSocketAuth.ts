"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import useSocketStore from "@/stores/useSocketStore"
import type { Session } from "next-auth"
import { update } from "@/utils/socketHelpers"

export function useSocketAuth() {
  const { data: session, status } = useSession()
  const socket = useSocketStore((state) => state.socket)
  const connect = useSocketStore((state) => state.connect)
  const isConnecting = useSocketStore((state) => state.isConnecting)
  const connectionAttempted = useRef(false)

  useEffect(() => {
    /*
    console.log("useSocketAuth effect running", {
      session,
      socket,
      connectionAttempted: connectionAttempted.current,
      status,
      isConnecting,
    })*/
    if (
      status === "authenticated" &&
      session?.user?.smartRotomUser &&
      !socket &&
      !isConnecting &&
      !connectionAttempted.current
    ) {
      //console.log("Attempting to connect socket")
      connectionAttempted.current = true
      connect(session.user.smartRotomUser)
    }
  }, [session, socket, connect, status, isConnecting])

  useEffect(() => {
    if (!socket) return

    //console.log("Setting up socket listeners")
    // Listen for user data updates
    const handleUserUpdated = async (data: any) => {
      //console.log("user:updated event received", data)
      if (data.userId === (session as Session)?.user?.id) {
        try {
          await update(data.updates)
          //console.log("Session updated successfully")
        } catch (error) {
          //console.error("Failed to update session:", error)
        }
      }
    }

    socket.on("user:updated", handleUserUpdated)

    return () => {
      //console.log("Cleaning up socket listeners")
      socket.off("user:updated", handleUserUpdated)
    }
  }, [socket, session])

  return socket
}

