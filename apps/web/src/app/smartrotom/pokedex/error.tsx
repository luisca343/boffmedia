"use client"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function PokedexError({ error, reset }: { error: Error; reset: () => void }) {
  return <AppErrorFallback appName="Pokédex" error={error} reset={reset} />
}
