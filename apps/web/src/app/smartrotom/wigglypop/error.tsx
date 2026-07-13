"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function WigglypopError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Wigglypop" error={error} reset={reset} />
}
