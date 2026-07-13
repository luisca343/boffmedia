"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function CamaraError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Cámara" error={error} reset={reset} />
}
