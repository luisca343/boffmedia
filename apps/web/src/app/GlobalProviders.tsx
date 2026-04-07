"use client"
import { SessionProvider } from "next-auth/react"
import { UserSocketListener } from "../providers/UserSocketListener"
import { SocketProvider } from "@/providers/SocketProvider"

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
    <SessionProvider>
        <SocketProvider>
            {children}
        </SocketProvider>
    </SessionProvider>
    )
}