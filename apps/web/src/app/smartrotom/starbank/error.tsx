"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function StarBankError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="StarBank" error={error} reset={reset} />
}
