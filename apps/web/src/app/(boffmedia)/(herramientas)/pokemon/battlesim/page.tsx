import { Suspense } from "react"
import type { Metadata } from "next"
import { BsimApp } from "./_components/BsimApp"

export const metadata: Metadata = {
  title: "Battlesim",
  description: "Simulador de combates Pokémon — juega contra la IA, PvP o en Showdown.",
}

export default function BattlesimPage() {
  return (
    <Suspense>
      <BsimApp />
    </Suspense>
  )
}
