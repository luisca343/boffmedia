'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useSocketStore from '@/stores/useSocketStore'
import { Session } from "next-auth";

export function useSocketAuth() {
  const { data: session, update } = useSession()
  const socket = useSocketStore(state => state.socket)
  const connect = useSocketStore(state => state.connect)

  useEffect(() => {
    if (session?.user?.smartRotomUser && !socket) {
      connect(session.user.smartRotomUser)
    }
  }, [session, socket, connect])

  useEffect(() => {
    if (!socket) return

    // Listen for user data updates
    socket.on('user:updated', async (data) => {
      if (data.userId === (session as Session).user.id) {
        await update(data.updates)
      }
    })

    return () => {
      socket.off('user:updated')
    }
  }, [socket, session, update])

  return socket
}

