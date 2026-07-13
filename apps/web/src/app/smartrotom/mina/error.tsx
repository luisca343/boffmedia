"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function MinaError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Mina" error={error} reset={reset} />
}
