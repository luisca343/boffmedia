"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function PcError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="PC" error={error} reset={reset} />
}
