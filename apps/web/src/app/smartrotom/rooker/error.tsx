"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function RookerError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Rooker" error={error} reset={reset} />
}
