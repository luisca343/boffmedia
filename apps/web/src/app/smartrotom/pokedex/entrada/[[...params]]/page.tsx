import { EvoTree } from "./_components/EvoTree"
import { SpawnInfo } from "../../_types/spawnInfo"
import { GenderProperties, Pokemon } from "@/types/Pokemon"
import { getTranslations } from "next-intl/server"
import { StatsTable } from "./_components/StatsTable"
import { SpawnTable } from "./_components/SpawnTable"
import { EntryHeader } from "./_components/EntryHeader"
import { BasicInfo } from "./_components/ClientBasicInfo"
import { PokedexSection } from "../../_components/PokedexSection"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { UnifiedMovesTable } from "./_components/MovesTable"
import { getFormName, getPokemonId } from "../../dexUtils"
import PokemonList from "./_components/PokemonList"
import { TypeEffectivenessSection } from "./_components/TypeEffectivenessSection"
import { PalettesSection } from "./_components/PalettesSection"

export default async function EntradaPokedex({ params }: any) {
  const resolvedParams = await params
  if (!resolvedParams.params) return <PokemonList />
  const t = await getTranslations("pokedex")

  let [pokemonIndex, formIndex] = resolvedParams.params as [number, number | string]

  const pokemon = (await PokemonService.getPokemonByDex(pokemonIndex)).data as Pokemon

  if (pokemonIndex === undefined) {
    pokemonIndex = 0
  }

  if (formIndex === undefined) {
    formIndex = 0
  } else if (!parseInt(formIndex + "")) {
    formIndex = pokemon.forms.findIndex((form) => form.name === formIndex)
    formIndex = formIndex === -1 ? 0 : formIndex
  } else {
    formIndex = parseInt(formIndex + "") - 1
  }

  const { next, prev } = (await PokemonService.getNextPrev(pokemonIndex)).data!
  const moves = await (await PokemonService.getMoves(pokemonIndex, formIndex)).data

  if (!pokemon) return <h1>Pokemon no encontrado {pokemonIndex}</h1>
  if (!pokemon.forms[formIndex]) return <h1>Forma no encontrada {formIndex}</h1>

  const formName = getFormName(pokemon, formIndex)

  const spawns = (await PokemonService.getSpawns(getPokemonId(pokemon.name, formName))).data as SpawnInfo[]

  const type1 = (pokemon.forms[formIndex]?.types?.[0] ?? pokemon.forms[0]?.types?.[0]) as string
  const type2 = (pokemon.forms[formIndex]?.types?.[1] ?? pokemon.forms[0]?.types?.[1]) as string

  const genderProperties = pokemon.forms[formIndex].genderProperties as GenderProperties[]
  const palettes = genderProperties?.map((gender) => {
    return gender.palettes.map((palette) => {
      const sprite =
        typeof palette.sprite === "object" ? palette.sprite.resource?.split(":")[1] : palette.sprite?.split(":")[1]
      return {
        name: palette.name,
        sprite,
      }
    })
  })

  return (
    <EntryHeader pokemon={pokemon} formName={formName} prev={prev} next={next}>
      <div className="flex flex-col gap-8 p-6 min-w-0 overflow-auto" style={{ scrollMarginTop: "130px" }}>
        <section id="info">
          <BasicInfo pokemon={pokemon} formIndex={formIndex} formName={formName} pokemonIndex={pokemonIndex} />
        </section>

        <section id="evotree">
          <PokedexSection title={t("entry_tab_evotree")}>
            <EvoTree params={{ id: pokemon.dex.toString() }} />
          </PokedexSection>
        </section>

        <section id="stats">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron font-bold text-[17px] tracking-tight text-surface-50 flex items-center gap-2.5">
              <span className="font-jetbrains text-[10px] text-surface-500 tracking-[0.12em]">03</span>
              {t("entry_tab_stats")}
            </h3>
          </div>
          <StatsTable pokemon={pokemon} formIndex={formIndex} />
        </section>

        <section id="typedata">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron font-bold text-[17px] tracking-tight text-surface-50 flex items-center gap-2.5">
              <span className="font-jetbrains text-[10px] text-surface-500 tracking-[0.12em]">04</span>
              {t("entry_tab_types")}
            </h3>
          </div>
          <TypeEffectivenessSection type1={type1} type2={type2} />
        </section>

        <section id="spawns">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron font-bold text-[17px] tracking-tight text-surface-50 flex items-center gap-2.5">
              <span className="font-jetbrains text-[10px] text-surface-500 tracking-[0.12em]">05</span>
              {t("entry_tab_spawns")}
            </h3>
          </div>
          <SpawnTable spawns={spawns} />
        </section>

        <section id="moves">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-orbitron font-bold text-[17px] tracking-tight text-surface-50 flex items-center gap-2.5">
              <span className="font-jetbrains text-[10px] text-surface-500 tracking-[0.12em]">06</span>
              {t("entry_tab_moves")}
            </h3>
          </div>
          <UnifiedMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves} />
        </section>

        <section id="palettes">
          <PalettesSection palettes={palettes} pokemonIndex={pokemonIndex} formName={formName} />
        </section>
      </div>
    </EntryHeader>
  )
}
