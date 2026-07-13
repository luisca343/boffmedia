"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function GobiernoError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Gobierno de Teras" error={error} reset={reset} />
}
