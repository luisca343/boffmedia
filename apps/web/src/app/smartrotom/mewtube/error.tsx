"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function MewTubeError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="MewTube" error={error} reset={reset} />
}
