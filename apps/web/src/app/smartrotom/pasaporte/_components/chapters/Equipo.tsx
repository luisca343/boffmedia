"use client"

// PAPER.

import { useTranslations } from "next-intl"
import type { PokemonW } from "@boffmedia/shared"
import { typesOf, prettyItem } from "@/app/smartrotom/pc/_utils/derive"
import { TYPE_LABELS } from "@/app/smartrotom/pokedex/_utils/typeColors"
import { usePokemonStore } from "@/stores/pokemonStore"
import { moveName } from "../../_utils/medals"
import { Bar, Card, EmptyState, PageHead, Skeleton, Sprite, TypePill } from "../ui"

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const

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
  const t = useTranslations("pasaporte")
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
    <Card className="px-[0.6875rem] py-[0.5625rem]">
      <div className="flex items-center gap-[0.5625rem]">
        <Sprite dex={mon.dex} form={mon.form} palette={mon.palette} name={mon.name} size={50} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-ps-ceremony text-[0.875rem]">{mon.name || mon.species}</span>
            <span className="ps-num flex-none font-ps-mono text-[0.625rem] text-ps-ink-faint">
              {t("common.level", { level: mon.level })}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {types.map((t, i) => (
              <TypePill key={`${i}-${t}`} type={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[0.6875rem]">
        <b className="truncate font-semibold">{mon.ability}</b>
        {mon.item && mon.item !== NO_ITEM && (
          <span className="truncate text-ps-ink-soft">{prettyItem(mon.item)}</span>
        )}
      </div>

      <ul className="mt-[0.3125rem] grid grid-cols-2 gap-x-2.5 gap-y-[3px]">
        {moves.map((move, i) => (
          <li key={`${i}-${move}`} className="relative truncate pl-[0.6875rem] text-[0.6875rem]">
            <span
              aria-hidden="true"
              className="absolute left-0 top-[0.375rem] h-[0.3125rem] w-[0.3125rem] rounded-full bg-ps-chapter"
            />
            {move}
          </li>
        ))}
      </ul>

      <div className="mt-[0.4375rem] grid grid-cols-6 gap-[3px] text-center">
        {stats.map((value, i) => {
          const statLabel = STAT_KEYS[i] ? t(`equipo.stats.${STAT_KEYS[i]}`) : undefined
          return (
            <div key={STAT_KEYS[i] ?? i}>
              <div className="text-[0.5625rem] uppercase text-ps-ink-faint">{statLabel}</div>
              <div className="ps-num font-ps-mono text-[0.75rem] font-bold">{value}</div>
              <Bar value={value} max={peak} thin className="mt-0.5 h-[3px]" label={`${statLabel} ${value}`} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function Equipo({ team, loading }: { team?: PokemonW[] | null; loading: boolean }) {
  const t = useTranslations("pasaporte")

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("equipo.eyebrow")} title={t("equipo.title")} />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[7.5rem]" />
          ))}
        </div>
      </>
    )
  }

  const mons = (team ?? []).filter(Boolean)

  if (mons.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("equipo.eyebrow")} title={t("equipo.title")} />
        <EmptyState icon="heart" title={t("equipo.empty.title")} sub={t("equipo.empty.sub")} />
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow={t("equipo.eyebrowCount", { count: mons.length })} title={t("equipo.title")} />
      <div className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-[0.5625rem]">
        {mons.map((mon, i) => (
          <MonCard key={`${mon.dex}-${mon.name}-${i}`} mon={mon} />
        ))}
      </div>
    </>
  )
}
