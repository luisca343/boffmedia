"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function ChatAppError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="ChatApp" error={error} reset={reset} />
}
