"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function LigaError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Liga" error={error} reset={reset} />
}
