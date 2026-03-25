'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSocketAuth } from '@/services/useSocketAuth'
import { Session } from 'next-auth'

export function UserSocketListener() {
  const { data: session, update } = useSession()  as { data: Session | null, update: (data: any) => void }
  const socket = useSocketAuth()

  useEffect(() => {
    if (!socket) return

    // Listen for user updates
    socket.on('user:updated', async (data: any) => {
      if (data.userId === session?.user.id) {
        // Update the session with new data
        await update(data.updates)
      }
    })

    return () => {
      socket.off('user:updated')
    }
  }, [socket, session, update])

  return null
}

