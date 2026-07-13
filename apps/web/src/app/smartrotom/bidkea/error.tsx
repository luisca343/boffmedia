"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function BidkeaError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Bidkea" error={error} reset={reset} />
}
