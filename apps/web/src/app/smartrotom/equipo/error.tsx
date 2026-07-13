"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function EquipoError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Equipo" error={error} reset={reset} />
}
