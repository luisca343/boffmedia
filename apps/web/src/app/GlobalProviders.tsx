"use client"
import { SessionProvider } from "next-auth/react"
import { UserSocketListener } from "../providers/UserSocketListener"
import { SocketProvider } from "@/providers/SocketProvider"
import { BoffQueryProvider } from "@/providers/BoffQueryProvider"
import { ToolSessionBridge } from "@/lib/ToolSessionBridge"
import { TwoFactorGate } from "@/features/TwoFactorGate"

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
    <SessionProvider>
        {/* Inside SessionProvider: the retry policy refuses to retry while the
            session is pending its second factor, and reads that from here. */}
        <BoffQueryProvider>
            <SocketProvider>
                {/* Publishes the session into @boffmedia/tool-kit's host. Here
                    because it needs SessionProvider above it; renders nothing. */}
                <ToolSessionBridge />
                {/* Keeps a half-finished admin sign-in on /entrar/2fa. Renders
                    nothing; needs SessionProvider above it. */}
                <TwoFactorGate />
                {children}
            </SocketProvider>
        </BoffQueryProvider>
    </SessionProvider>
    )
}
