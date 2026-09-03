import { EvoTree } from "./_components/EvoTree"
import { SpawnInfo } from "../../_types/spawnInfo"
import { GenderProperties, Pokemon } from "@/types/Pokemon"
import { StatsTable } from "./_components/StatsTable"
import { SpawnTable } from "./_components/SpawnTable"
import { EntryHeader } from "./_components/EntryHeader"
import { EntryHero } from "./_components/EntryHero"
import { BasicInfo } from "./_components/ClientBasicInfo"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { UnifiedMovesTable } from "./_components/MovesTable"
import { getFormName, getPokemonId } from "../../dexUtils"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import PokemonList from "./_components/PokemonList"
import { TypeEffectivenessSection } from "./_components/TypeEffectivenessSection"
import { PalettesSection } from "./_components/PalettesSection"
import { getTranslations } from "next-intl/server"

function SectionHead({
  num,
  title,
  meta,
  sub,
  action,
}: {
  num: string
  title: string
  meta?: string
  sub?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h2 className="flex items-center gap-2.5 font-pk-display font-bold text-[1.0625rem] tracking-tight text-pk-surface-50 m-0">
        <span className="font-pk-mono text-[0.625rem] tracking-[0.12em] text-pk-surface-500">{num}</span>
        {title}
        {meta && <span className="font-pk-mono text-[0.6875rem] text-pk-surface-500 ml-1.5">{meta}</span>}
      </h2>
      {sub && <span className="text-[0.6875rem] text-pk-surface-500">{sub}</span>}
      {action}
    </div>
  )
}

export default async function EntradaPokedex({ params }: any) {
  const t = await getTranslations("pokedex")
  const resolvedParams = await params
  if (!resolvedParams.params) return <PokemonList />

  let [pokemonIndex, formIndex] = resolvedParams.params as [number, number | string]

  // Every read below resolves to `{ success: false }` on an HTTP error instead of throwing.
  // Reading `.data` off that gives `undefined`, and the destructuring/`.forms` access that
  // follows would crash the route into the error boundary rather than show "no encontrado".
  const pokemonRes = await PokemonService.getPokemonByDex(pokemonIndex)
  const pokemon = (pokemonRes.success ? pokemonRes.data : undefined) as Pokemon | undefined

  if (pokemonIndex === undefined) pokemonIndex = 0

  if (!pokemon?.forms) return <h1 className="p-6 text-pk-surface-100">{t("entrada_pokemon_not_found", { id: pokemonIndex })}</h1>

  if (formIndex === undefined) {
    formIndex = 0
  } else if (!parseInt(formIndex + "")) {
    formIndex = pokemon.forms.findIndex((form) => form.name === formIndex)
    formIndex = formIndex === -1 ? 0 : formIndex
  } else {
    formIndex = parseInt(formIndex + "") - 1
  }

  const nextPrevRes = await PokemonService.getNextPrev(pokemonIndex)
  const { next, prev } = (nextPrevRes.success ? nextPrevRes.data : undefined) ?? { next: null, prev: null }

  const movesRes = await PokemonService.getMoves(pokemonIndex, formIndex)
  const moves = movesRes.success ? movesRes.data : undefined

  if (!pokemon.forms[formIndex]) return <h1 className="p-6 text-pk-surface-100">{t("entrada_form_not_found", { id: formIndex })}</h1>

  const formName = getFormName(pokemon, formIndex)
  const spawnsRes = await PokemonService.getSpawns(getPokemonId(pokemon.name, formName))
  const spawns = ((spawnsRes.success ? spawnsRes.data : undefined) ?? []) as SpawnInfo[]

  const type1 = (pokemon.forms[formIndex]?.types?.[0] ?? pokemon.forms[0]?.types?.[0]) as string
  const type2 = (pokemon.forms[formIndex]?.types?.[1] ?? pokemon.forms[0]?.types?.[1]) as string

  const genderProperties = pokemon.forms[formIndex].genderProperties as GenderProperties[]
  const palettes = genderProperties?.map((gender) =>
    gender.palettes.map((palette) => {
      const sprite = typeof palette.sprite === "object" ? palette.sprite.resource?.split(":")[1] : palette.sprite?.split(":")[1]
      return { name: palette.name, sprite }
    })
  )

  return (
    <EntryHeader pokemon={pokemon} formName={formName} prev={prev} next={next}>
      <div className="flex flex-col gap-8 px-7 pt-7 pb-[3.75rem] min-w-0">
        <section id="info" className="scroll-mt-[130px]">
          <div className="flex flex-col gap-7">
            <EntryHero pokemon={pokemon} formIndex={formIndex} formName={formName} />
            <BasicInfo pokemon={pokemon} formIndex={formIndex} formName={formName} />
          </div>
        </section>

        <section id="evo" className="scroll-mt-[130px]">
          <SectionHead num="02" title={t("entrada_evolution_chain")} />
          <EvoTree params={{ id: pokemon.dex.toString() }} />
        </section>

        <section id="stats" className="scroll-mt-[130px]">
          <SectionHead num="03" title={t("entrada_base_stats")} sub={t("entrada_stats_sub")} />
          <StatsTable pokemon={pokemon} formIndex={formIndex} />
        </section>

        <section id="effect" className="scroll-mt-[130px]">
          <SectionHead num="04" title={t("entrada_type_effectiveness")} />
          <TypeEffectivenessSection type1={type1} type2={type2} />
        </section>

        <section id="spawns" className="scroll-mt-[130px]">
          <SectionHead
            num="05"
            title={t("entrada_spawn_locations")}
            meta={`(${spawns?.length ?? 0})`}
            action={
              <Link href="/smartrotom/pokedex/spawns" className="inline-flex items-center gap-1 text-xs text-pk-surface-400 hover:text-pk-primary-300 transition-colors">
                {t("entrada_view_full_table")} <ArrowRightIcon className="w-3 h-3" />
              </Link>
            }
          />
          <SpawnTable spawns={spawns} />
        </section>

        <section id="moves" className="scroll-mt-[130px]">
          <SectionHead num="06" title={t("entrada_moves")} />
          <UnifiedMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves} />
        </section>

        <section id="variants" className="scroll-mt-[130px]">
          <SectionHead num="07" title={t("entrada_variants_and_shiny")} />
          <PalettesSection palettes={palettes} pokemonIndex={pokemonIndex} formName={formName} />
        </section>
      </div>
    </EntryHeader>
  )
}
