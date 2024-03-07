"use client"
import { SessionProvider } from "next-auth/react"

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>
}