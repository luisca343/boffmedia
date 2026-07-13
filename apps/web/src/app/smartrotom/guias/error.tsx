"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function GuiasError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Guías" error={error} reset={reset} />
}
