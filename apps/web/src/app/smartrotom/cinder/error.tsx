"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function CinderError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Cinder" error={error} reset={reset} />
}
