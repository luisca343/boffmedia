"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function MewTwitchError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="MewTwitch" error={error} reset={reset} />
}
