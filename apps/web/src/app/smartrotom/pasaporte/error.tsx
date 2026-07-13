"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function PasaporteError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Pasaporte" error={error} reset={reset} />
}
