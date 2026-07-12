"use client"
import type { ReactNode } from "react"
import { usePokedexData } from "@/hooks/usePokedexData"
import { LoadingScreen } from "@/components/smartrotom/Loading"

// Ambient multi-layer background lifted from the Pokédex design tokens.
// Kept inline: Tailwind can't express stacked radial gradients.
const PK_BG =
  "radial-gradient(1200px 600px at 80% -10%, rgba(249,115,22,.06), transparent 70%)," +
  "radial-gradient(900px 500px at -10% 30%, rgba(6,182,212,.05), transparent 70%)," +
  "radial-gradient(900px 600px at 50% 110%, rgba(168,85,247,.05), transparent 70%)," +
  "#030609"

export default function PokedexLayout({ children }: { children: ReactNode }) {
  const { isLoading } = usePokedexData()

  return (
    <div
      className="pk-app h-full overflow-hidden font-pk text-pk-surface-100 antialiased [font-feature-settings:'ss01','cv11']"
      style={{ background: PK_BG }}
    >
      {isLoading ? <LoadingScreen /> : children}
    </div>
  )
}
