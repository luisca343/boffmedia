"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function TiempoError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Tiempo" error={error} reset={reset} />
}
