"use client"

import { useMemo } from "react"
import { getPokemonDefense } from "@/app/smartrotom/pokedex/dexUtils"
import { TypeBadge } from "./ui"

export interface TypeMatchupsProps {
  types: string[]
}

type Entry = [type: string, multiplier: number]

/**
 * Defensive matchups, off the Pokédex's own type chart. That is domain data, not a
 * design-system import — there is exactly one correct type chart and duplicating it
 * here would be the way to get two of them.
 */
export function TypeMatchups({ types }: TypeMatchupsProps) {
  const groups = useMemo(() => {
    const weak: Entry[] = []
    const resist: Entry[] = []
    const immune: Entry[] = []
    if (types.length === 0) return { weak, resist, immune }

    const defense = getPokemonDefense(types[0], types[1] ?? "")
    for (const [type, mult] of Object.entries(defense)) {
      if (mult === 0) immune.push([type, mult])
      else if (mult > 1) weak.push([type, mult])
      else if (mult < 1) resist.push([type, mult])
    }
    weak.sort((a, b) => b[1] - a[1])
    resist.sort((a, b) => a[1] - b[1])
    return { weak, resist, immune }
  }, [types])

  if (types.length === 0) {
    return <p className="text-xs text-pc-fg-subtle">Sin datos de tipo para este Pokémon.</p>
  }

  return (
    <div>
      <Group label="Débil contra" entries={groups.weak} tone="text-pc-rose" />
      <Group label="Resiste" entries={groups.resist} tone="text-pc-green" />
      <Group label="Inmune" entries={groups.immune} tone="text-pc-fg-muted" />
    </div>
  )
}

/** `tone` is a literal `text-pc-*` class, chosen by the caller — never interpolated. */
function Group({ label, entries, tone }: { label: string; entries: Entry[]; tone: string }) {
  if (entries.length === 0) return null
  return (
    <div className="mb-2.5">
      <div className={`mb-1.5 text-[10.5px] font-bold uppercase tracking-[.05em] ${tone}`}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([type, mult]) => (
          <span key={type} className="inline-flex items-center gap-1">
            <TypeBadge type={type} size="sm" />
            <span className="font-pc-mono text-[10px] text-pc-fg-subtle">×{mult}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
