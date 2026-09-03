"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/smartrotom/Loading"
import { AppQueryProvider as GobiernoQueryProvider } from "@/components/smartrotom/behavior/QueryProvider"
import { GobiernoHeader } from "./_components/chrome/GobiernoHeader"
import { GobiernoNav } from "./_components/chrome/GobiernoNav"
import { CommandPalette } from "./_components/chrome/CommandPalette"
import { Dossier } from "./_components/chrome/Dossier"
import { ToastHost } from "./_components/ui"
import { useOfficer } from "./_hooks/useOfficer"
import { useGobiernoPrefs } from "./_stores/useGobiernoPrefs"

/**
 * Scope root for Gobierno de Teras (`gt-*`). Light-only — the warm paper IS the design —
 * so there is no `data-theme` here and the app ignores the platform theme picker's mode,
 * exactly like Furret Today, Pokédex, Arcade and Misiones.
 *
 * Client-side gate: defence-in-depth and UX only. The authoritative check is the role
 * guard on each /smartrotom/gobierno endpoint.
 */
export default function GobiernoLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { status, canOpen } = useOfficer()
  const accent = useGobiernoPrefs((s) => s.accent)
  const density = useGobiernoPrefs((s) => s.density)

  useEffect(() => {
    if (status !== "loading" && !canOpen) router.replace("/smartrotom")
  }, [status, canOpen, router])

  if (status === "loading" || !canOpen) return <LoadingScreen />

  return (
    <GobiernoQueryProvider>
      <div
        className="gt-app gt-paper flex h-[100dvh] flex-col overflow-hidden bg-gt-paper-bg font-gt text-gt-ink-800"
        data-accent={accent}
        data-density={density}
      >
        <GobiernoHeader />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <GobiernoNav />
          <main className="gt-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[82.5rem] px-4 pb-10 pt-4 md:px-[1.625rem] md:pb-10 md:pt-[1.375rem]">
              {children}
            </div>
          </main>
        </div>

        <Dossier />
        <CommandPalette />
        <ToastHost />
      </div>
    </GobiernoQueryProvider>
  )
}
