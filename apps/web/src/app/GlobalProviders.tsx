"use client"
import { SessionProvider } from "next-auth/react"
import { UserSocketListener } from "../providers/UserSocketListener"
import { SocketProvider } from "@/providers/SocketProvider"
import { BoffQueryProvider } from "@/providers/BoffQueryProvider"
import { ToolSessionBridge } from "@/lib/ToolSessionBridge"
import { TwoFactorGate } from "@/features/TwoFactorGate"
import { SessionExpiredProvider } from "@/features/SessionExpiredContext"
import { SessionExpiredDialog } from "@/features/SessionExpiredDialog"

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
    <SessionProvider>
        {/* Inside SessionProvider: the retry policy refuses to retry while the
            session is pending its second factor, and reads that from here. */}
        <BoffQueryProvider>
            <SessionExpiredProvider>
                <SocketProvider>
                    {/* Publishes the session into @boffmedia/tool-kit's host. Here
                        because it needs SessionProvider above it; renders nothing. */}
                    <ToolSessionBridge />
                    {/* Keeps a half-finished admin sign-in on /entrar/2fa. Renders
                        nothing; needs SessionProvider above it. */}
                    <TwoFactorGate />
                    {/* Shows session expired dialog when a 401 occurs and session
                        is not pending 2FA. Renders nothing until triggered. */}
                    <SessionExpiredDialog />
                    {children}
                </SocketProvider>
            </SessionExpiredProvider>
        </BoffQueryProvider>
    </SessionProvider>
    )
}
