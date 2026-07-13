"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function NotasError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Notas" error={error} reset={reset} />
}
