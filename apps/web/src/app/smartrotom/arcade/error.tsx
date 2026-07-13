"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function ArcadeError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Arcade" error={error} reset={reset} />
}
