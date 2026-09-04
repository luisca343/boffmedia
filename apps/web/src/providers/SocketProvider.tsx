"use client"

import { useSocketAuth } from "@/services/useSocketAuth"
import { type ReactNode } from "react"
import { BoffmediaConnectionBanner } from "@/app/_components/BoffmediaConnectionBanner"

export function SocketProvider({ children }: { children: ReactNode }) {
  // Initialize socket connection and auth listeners
  const socket = useSocketAuth()

  return (
    <>
      <BoffmediaConnectionBanner />
      {children}
    </>
  )
}

