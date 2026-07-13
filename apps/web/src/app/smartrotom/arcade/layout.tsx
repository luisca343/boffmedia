import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ArcadePrefsProvider } from "./_hooks/useArcadePrefs"
import { AppQueryProvider as ArcadeQueryProvider } from "@/components/smartrotom/behavior/QueryProvider"
import { ArcadeShell } from "./_components/ArcadeShell"

export const metadata: Metadata = {
  title: "Arcade · SmartRotom",
  description: "Minijuegos, racha diaria y cajas del servidor de SmartRotom.",
}

export default function ArcadeLayout({ children }: { children: ReactNode }) {
  return (
    <ArcadeQueryProvider>
      <ArcadePrefsProvider>
        <ArcadeShell>{children}</ArcadeShell>
      </ArcadePrefsProvider>
    </ArcadeQueryProvider>
  )
}
