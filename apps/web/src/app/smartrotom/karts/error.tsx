"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function KartsError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Karts" error={error} reset={reset} />
}
