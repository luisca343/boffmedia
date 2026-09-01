import * as React from "react"
import { PokemonSprite } from "./PokemonSprite"

// .— minimal Pokémon card (results strip, lists).
export function MiniCard({ name, sub }: { name: string; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-[10px]">
      <span className="grid h-11 w-11 flex-none place-items-center border border-solid border-line bg-base">
        <PokemonSprite name={name} size={38} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-[15px]/[1.1] font-bold uppercase tracking-[0.03em]">{name}</span>
        <span className="block truncate font-mono text-[11px]/[1.3] font-medium text-txt-muted">{sub}</span>
      </span>
    </div>
  )
}
