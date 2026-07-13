"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function FurretTodayError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Furret Today" error={error} reset={reset} />
}
