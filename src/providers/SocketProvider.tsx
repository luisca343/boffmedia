'use client'

import { useSocketAuth } from '@/services/useSocketAuth'
import { ReactNode } from 'react'

export function SocketProvider({ children }: { children: ReactNode }) {
  // Initialize socket connection and auth listeners
  useSocketAuth()
  
  return <>{children}</>
}

