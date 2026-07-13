"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function MisionesError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Misiones" error={error} reset={reset} />
}
