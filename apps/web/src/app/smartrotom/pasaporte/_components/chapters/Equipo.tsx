"use client"

// PAPER.

import type { PokemonW } from "@boffmedia/shared"
import { typesOf, prettyItem } from "@/app/smartrotom/pc/_utils/derive"
import { TYPE_LABELS } from "@/app/smartrotom/pokedex/_utils/typeColors"
import { usePokemonStore } from "@/stores/pokemonStore"
import { moveName } from "../../_utils/medals"
import { Bar, Card, EmptyState, PageHead, Skeleton, Sprite, TypePill } from "../ui"

const STAT_LABELS = ["PS", "At", "Def", "AtS", "DefS", "Vel"] as const

/** Pixelmon sends an empty hand as an item id, not as an empty string. */
const NO_ITEM = "item.minecraft.air"

/**
 * `PokemonW.ivs`, `.evs` and `.stats` are declared `number[]` on the API entity but ship as
 * `string[]` in `@boffmedia/shared` (the OpenAPI generator cannot infer the item type of an
 * array that only carries an `example`). Every arithmetic read of them therefore goes
 * through `Number()` — without it `Math.max` gets strings and the bars silently size off
 * lexical order, which is the same class of bug that once made every IV sum a string
 * concatenation.
 */
function nums(values: readonly (number | string)[] | undefined): number[] {
  return (values ?? []).map((v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  })
}

function MonCard({ mon }: { mon: PokemonW }) {
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)

  // The party payload carries no types; they are looked up on the species' form in the
  // Pokédex store — real data, already fetched — and printed in Spanish.
  const types = typesOf(mon, speciesByDex).map((t) => TYPE_LABELS[t] ?? t)

  const stats = nums(mon.stats)
  const peak = Math.max(1, ...stats)

  // `PokemonW.moves` is typed `(string | null)[]`, and the party endpoint does not honour
  // that: it sends move OBJECTS (`{name, type, category, power, accuracy}`). Rendering the
  // declared type straight into JSX crashes the page with "Objects are not valid as a React
  // child" — verified live. Every slot therefore goes through `moveName()`, which reads both
  // shapes and drops an empty one.
  const moves = (mon.moves ?? []).map(moveName).filter((m): m is string => !!m)

  return (
    <Card className="px-[11px] py-[9px]">
      <div className="flex items-center gap-[9px]">
        <Sprite dex={mon.dex} form={mon.form} palette={mon.palette} name={mon.name} size={50} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-ps-ceremony text-[14px]">{mon.name || mon.species}</span>
            <span className="ps-num flex-none font-ps-mono text-[10px] text-ps-ink-faint">Nv.{mon.level}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {types.map((t, i) => (
              <TypePill key={`${i}-${t}`} type={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[11px]">
        <b className="truncate font-semibold">{mon.ability}</b>
        {mon.item && mon.item !== NO_ITEM && (
          <span className="truncate text-ps-ink-soft">{prettyItem(mon.item)}</span>
        )}
      </div>

      <ul className="mt-[5px] grid grid-cols-2 gap-x-2.5 gap-y-[3px]">
        {moves.map((move, i) => (
          <li key={`${i}-${move}`} className="relative truncate pl-[11px] text-[11px]">
            <span
              aria-hidden="true"
              className="absolute left-0 top-[6px] h-[5px] w-[5px] rounded-full bg-ps-chapter"
            />
            {move}
          </li>
        ))}
      </ul>

      <div className="mt-[7px] grid grid-cols-6 gap-[3px] text-center">
        {stats.map((value, i) => (
          <div key={STAT_LABELS[i] ?? i}>
            <div className="text-[9px] uppercase text-ps-ink-faint">{STAT_LABELS[i]}</div>
            <div className="ps-num font-ps-mono text-[12px] font-bold">{value}</div>
            <Bar
              value={value}
              max={peak}
              thin
              className="mt-0.5 h-[3px]"
              label={`${STAT_LABELS[i]} ${value}`}
            />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function Equipo({ team, loading }: { team?: PokemonW[] | null; loading: boolean }) {
  if (loading) {
    return (
      <>
        <PageHead eyebrow="Compañeros" title="Equipo Actual" />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </>
    )
  }

  const mons = (team ?? []).filter(Boolean)

  if (mons.length === 0) {
    return (
      <>
        <PageHead eyebrow="Compañeros" title="Equipo Actual" />
        <EmptyState
          icon="heart"
          title="Sin equipo activo"
          sub="Este entrenador aún no ha registrado un equipo."
        />
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow={`Compañeros · ${mons.length}`} title="Equipo Actual" />
      <div className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-[9px]">
        {mons.map((mon, i) => (
          <MonCard key={`${mon.dex}-${mon.name}-${i}`} mon={mon} />
        ))}
      </div>
    </>
  )
}
