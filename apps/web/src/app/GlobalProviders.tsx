"use client"
import { SessionProvider } from "next-auth/react"
import { UserSocketListener } from "../providers/UserSocketListener"
import { SocketProvider } from "@/providers/SocketProvider"
import { ToolSessionBridge } from "@/lib/ToolSessionBridge"

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
    <SessionProvider>
        <SocketProvider>
            {/* Publishes the session into @boffmedia/tool-kit's host. Here
                because it needs SessionProvider above it; renders nothing. */}
            <ToolSessionBridge />
            {children}
        </SocketProvider>
    </SessionProvider>
    )
}