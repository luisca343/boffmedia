"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function TaxiError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Taxi" error={error} reset={reset} />
}
